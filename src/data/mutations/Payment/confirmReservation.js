// GrpahQL
import {
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull
} from 'graphql';
import { payment } from '../../../config';
import stripePackage from 'stripe';
const stripe = stripePackage(payment.stripe.secretKey);

import ReservationPaymentType from '../../types/ReservationPaymentType';

import { getCustomerId, getCustomerEmail } from '../../../libs/payment/stripe/helpers/getCustomerId';
import { createThread } from '../../../libs/payment/stripe/helpers/createThread';
import { updateReservation } from '../../../libs/payment/stripe/helpers/updateReservation';
import { blockDates } from '../../../libs/payment/stripe/helpers/blockDates';
import { createTransaction } from '../../../libs/payment/stripe/helpers/createTransaction';
import { emailBroadcast } from '../../../libs/payment/stripe/helpers/email';

// Sequelize models
import { Reservation, ListingData } from '../../models';

const confirmReservation = {

  type: ReservationPaymentType,

  args: {
    reservationId: { type: new NonNull(IntType) },
    paymentIntentId: { type: new NonNull(StringType) }
  },

  async resolve({ request, res }, {
    reservationId,
    paymentIntentId
  }) {

    try {
      let customerId, customerEmail, confirmIntent, amount = 0, status = 200, errorMessage;
      let requireAdditionalAction = false, paymentIntentSecret;

      // Check if user already logged in
      if (request.user && !request.user.admin) {
        let userId = request.user.id;

        let reservation = await Reservation.findOne({
          where: {
            id: reservationId
          }
        });

        if (reservation) {
          const listingData = await ListingData.findOne({
            attributes: ['currency'],
            where: {
              listId: reservation && reservation.dataValues && reservation.dataValues.listId
            },
            raw: true
          });
  
          customerId = await getCustomerId(userId);
          customerEmail = await getCustomerEmail(userId);
          amount = (reservation.dataValues && reservation.dataValues.total) + (reservation.dataValues && reservation.dataValues.guestServiceFee);

          try {
              confirmIntent = await stripe.paymentIntents.confirm(paymentIntentId);

              if (confirmIntent && confirmIntent.status === 'requires_source_action' && confirmIntent.next_action && confirmIntent.next_action.type === 'use_stripe_sdk') {
                status = 400;
                requireAdditionalAction = true;
                paymentIntentSecret = confirmIntent.client_secret;
              } else if (confirmIntent && confirmIntent.status === 'succeeded') {
                  status = 200;
              } else {
                  status = 400;
                  errorMessage = 'Sorry, something went wrong with your card. Please try again.';
              }
          } catch (error) {
              status = 400;
              errorMessage = error.message;
          }

          if (status === 200 && confirmIntent && 'id' in confirmIntent) {
            await updateReservation(reservationId, confirmIntent.id);
            await createThread(reservationId);
            await blockDates(reservationId);
            await createTransaction(
              reservationId,
              customerEmail,
              customerId,
              confirmIntent.id,
              Math.round(amount),
              listingData.currency,
              'booking',
              2
            );
            emailBroadcast(reservationId);
          }
  
          return await {
            results: reservation,
            status: status,
            errorMessage,
            requireAdditionalAction,
            paymentIntentSecret,
            reservationId
          };
        } else {
          return {
            errorMessage: errorMessage ? errorMessage : 'Oops! something went wrong. Please try again.',
            status: 400
          };
        }
      } else {
        return {
          status: 500,
          errorMessage: 'Please login with your account and try again.'
        }
      }

    } catch (error) {
      return {
        errorMessage: 'Something went wrong ' + error,
        status: 400
      };
    }
  },
};

export default confirmReservation;

/**
 
mutation confirmReservation($reservationId: Int!, $paymentIntentId: String!) {
  confirmReservation(reservationId: $reservationId, paymentIntentId: $paymentIntentId) {
    results {
      id
      listId
      hostId
      guestId
      checkIn
      checkOut
      guests
      message
      basePrice
      cleaningPrice
      currency
      discount
      discountType
      guestServiceFee
      hostServiceFee
      total
      confirmationCode
      createdAt
    }
    status
    errorMessage
    requireAdditionalAction
    paymentIntentSecret
    reservationId
  }
}

**/
