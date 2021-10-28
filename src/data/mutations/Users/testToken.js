// GrpahQL
import {
    GraphQLString as StringType,
    GraphQLNonNull as NonNull,
} from 'graphql';
// Config
import { auth, websiteUrl, payment } from '../../../config';


import Stripe from 'stripe';
const stripe = Stripe(payment.stripe.secretKey);

// Helpers
import jwt from 'jsonwebtoken';

import UserType from '../../types/UserType';

import { verifyJWTToken, createJWToken } from '../../../libs/auth';
import { downloadFile } from '../../../libs/download';

// Fetch request
import fetch from '../../../libs/fetch';

import { sendEmail } from '../../../libs/sendEmail';

const testToken = {
    type: UserType,

    args: {
        token: { type: StringType }
    },

    async resolve({ request, response }, {
        token
    }) {
      let createCard;
        try {

            let cardDetails = {
                name: 'Latha',
                //number: 4242424242424242,
                number: 4000002500003155,
                exp_month: 12,
                exp_year: 2020,
                cvc: 123
              };
              let status = 200, errorMessage;
            //console.log('request', request.user);
            //const verifyToken = verifyJWTToken()
            //const createJWTokenTest = await createJWToken('abcd', 'lax@lax.com'); 
            //console.log('request', request);
            // const resp = await fetch(websiteUrl + '/sendEmailTemplate', {
            //     method: 'post',
            //     headers: {
            //       Accept: 'application/json',
            //       'Content-Type': 'application/json',
            //       //auth: request.headers.auth
            //     },
            //     body: JSON.stringify({
            //       to: 'laxman@radicalstart.com',
            //       type: 'welcomeEmail',
            //       content: {
            //         token: 'avc',
            //         name: 'Laxman',
            //         email: 'laxman@radicalstart.com'
            //       }
            //     })
            //   });

              let content = {
                token: 'avc',
                name: 'Laxman',
                email: 'laxman@radicalstart.com'
              };

            //   const { filename, status } = await downloadFile('https://techcrunch.com/wp-content/uploads/2017/10/twitch-logo.jpg');
              //const { status, errorMessage } = await sendEmail('laxman@radicalstart.com', 'welcomeEmail', content);
            //   console.log('filename', filename, status)
              //const { status, errorMessage } = await sendEmail('laxman@radicalstart.com', 'welcomeEmail', content);

              if (cardDetails && status === 200) {
                try {
                  // createCard = await stripe.tokens.create({
                  //   card: cardDetails
                  // });
                  console.log('INNNNNNNNN');
                  createCard = await stripe.paymentMethods.create({
                    type: 'card',
                    card: {
                      //number: '4242424242424242',
                      number: '4000002500003155',
                      exp_month: 2,
                      exp_year: 2021,
                      cvc: '314'
                    },
                  })

                  console.log('INNNNNNNNN');

                  console.log('createCard', createCard);
  
                } catch (error) {
                  status = 400;
                  errorMessage = error.message;
                }
              }

            return {
                userToken: createCard && createCard.id,
                status: 200
            }

        } catch (error) {
            return {
                errorMessage: 'Something went wrong! ' + error,
                status: 400
            }
        }
    }

};

export default testToken;

/*

mutation (
    $token: String
) {
    testToken (
        token: $token
    ) {
        	userToken
            status
            errorMessage
    }
}

*/