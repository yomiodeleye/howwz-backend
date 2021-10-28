import UserAccountType from '../../types/userAccountType';
import { UserProfile, UserVerifiedInfo } from '../../models';

import { sms, sitename } from '../../../config';
import twilio from 'twilio';

import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
} from 'graphql';

const client = new twilio(sms.twilio.accountSid, sms.twilio.authToken);

const AddPhoneNumber = {

    type: UserAccountType,

    args: {
        countryCode: { type: new NonNull(StringType) },
        phoneNumber: { type: new NonNull(StringType) },
    },

    async resolve({ request }, {
        countryCode,
        phoneNumber
    }) {

        try {

            if (request.user) {
             
                let published, errorMessage;
                let verificationCode = Math.floor(1000 + Math.random() * 9000);
                let message = sitename + ' security code: ' + verificationCode;
                message += '. Use this to finish your verification.';
                let userId = request.user.id;
                let convertedNumber = countryCode + phoneNumber;

                const isPhoneVerification = await UserVerifiedInfo.update({
                    isPhoneVerified: false
                },
                    {
                        where: {
                            userId
                        }
                    }
                );

                const publish = await UserProfile.update({
                    countryCode: countryCode,
                    phoneNumber: phoneNumber,
                    verificationCode: verificationCode
                }, {
                        where: {
                            userId
                        }
                    });


                let responseData = await client.messages
                    .create({
                        body: message,
                        from: sms.twilio.phoneNumber,
                        to: convertedNumber
                    });

                if (publish) {
                   
                    return {
                        status: 200,
                        countryCode,
                        phoneNumber
                    };
                } else {
                   
                    return {
                        status: 400,
                        errorMessage: 'Something went wrong.'
                    }
                }

            } else {
            
                return {
                    status: 500,
                    errorMessage: 'You are not LoggedIn'
                };
            }
        } catch (error) {
      
            return {
                status: 400,
                errorMessage: error.message

            }
        }
    },
};

export default AddPhoneNumber;

/**
mutation AddPhoneNumber($countryCode: String!, $phoneNumber: String!) {
    AddPhoneNumber(countryCode: $countryCode, phoneNumber: $phoneNumber) {
        status
    }
}
 */
