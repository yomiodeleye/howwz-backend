// GrpahQL
import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLFloat as FloatType,
    GraphQLNonNull as NonNull,
  } from 'graphql';
  
  import ReservationCommonType from '../../types/ReservationCommonType';
import { sendNotifications } from '../../../helpers/sendNotifications';
  
  // Sequelize models
  import { Reservation, ListBlockedDates, CancellationDetails,Threads, ThreadItems, UserProfile } from '../../models';
  
  const cancelReservation = {
  
    type: ReservationCommonType,
  
    args: {
      reservationId: { type: new NonNull(IntType)},
      cancellationPolicy: { type: new NonNull(StringType)},
      refundToGuest: { type: new NonNull(FloatType)},
      payoutToHost: { type: new NonNull(FloatType)},
      guestServiceFee: { type: new NonNull(FloatType)},
      hostServiceFee: { type: new NonNull(FloatType)},
      total: { type: new NonNull(FloatType)},
      currency: { type: new NonNull(StringType)},
      threadId: { type: new NonNull(IntType)},
      cancelledBy: { type: new NonNull(StringType)},
      message: { type: new NonNull(StringType)},
      checkIn: { type: new NonNull(StringType)},
      checkOut: { type: new NonNull(StringType)},
      guests: { type: new NonNull(IntType)},
    },
  
    async resolve({ request, response }, { 
      reservationId, 
      cancellationPolicy, 
      refundToGuest,
      payoutToHost, 
      guestServiceFee, 
      hostServiceFee, 
      total, 
      currency,
      threadId, 
      cancelledBy,
      message,
      checkIn,
      checkOut,
      guests
     }) {
     
      try{

      let isReservationUpdated = false;
      // Check if user already logged in
      if(request.user && !request.user.admin) {
  
          const userId = request.user.id;

          let notifyUserId ,notifyUserType, notifyContent;
          let userName, messageContent;

          const getThread = await Threads.findOne({
              where: {
                id: threadId
              },
              raw: true
            });

            if (getThread && getThread.host && getThread.guest) {
              notifyUserId = getThread.host === userId ? getThread.guest : getThread.host;
              notifyUserType = getThread.host === userId ? 'guest' : 'host';
            }

            const hostProfile = await UserProfile.findOne({
              where: {
                userId: getThread.host
              }
            });

            const guestProfile = await UserProfile.findOne({
              where: {
                userId: getThread.guest
              }
            });


            if (hostProfile && guestProfile && getThread) {
              userName = getThread.host === userId ? (hostProfile && hostProfile.displayName) : (guestProfile && guestProfile.displayName);
            }  
  
          const count = await Reservation.count({
            where: {
              id: reservationId,
              reservationState: 'cancelled'
            }
          });
  
          if(count > 0){
            return {
              status: 400,
              errorMessage: 'Cancelled Already',
            };
          }
  
          // Update Reservation table     
          const updateReservation = await Reservation.update({
            reservationState: 'cancelled'
          },{
            where: {
              id: reservationId
            }
          }).then(function(instance){
            // Check if any rows are affected
            if(instance > 0) {
              isReservationUpdated = true;
            }
          });
  
          // Unblock the blocked dates only if guest cancels the reservation
          if(cancelledBy === 'guest'){
            // const unlockBlockedDates = await ListBlockedDates.destroy({
            //   where: {
            //     reservationId
            //   }
            // });

            const unlockBlockedDates = await ListBlockedDates.update({
              reservationId: null,
              calendarStatus: 'available'
            }, {
                where: {
                  reservationId,
                  calendarStatus: 'blocked',
                  isSpecialPrice: {
                    $ne: null
                  }
                }
              });

              const unblockDatesWithOutPrice = await ListBlockedDates.destroy({
                  where: {
                    reservationId,
                    calendarStatus: 'blocked',
                    isSpecialPrice: {
                      $eq: null
                    }
                  }
                });
                
          }
  
          // Create record for cancellation details
          const cancellation = CancellationDetails.create({
            reservationId,
            cancellationPolicy,
            refundToGuest,
            payoutToHost, 
            guestServiceFee, 
            hostServiceFee, 
            total, 
            currency,
            cancelledBy
          });
  
          // Create thread items
          const thread = ThreadItems.create({
            threadId,
            reservationId,
            sentBy: userId,
            content: message,
            type: cancelledBy === 'host' ? 'cancelledByHost' : 'cancelledByGuest',
            startDate: checkIn,
            endDate: checkOut,
            personCapacity: guests
          });

          messageContent = userName + ': ' + message;

          notifyContent = {
            "screenType": "trips",
            "title": 'Booking is Cancelled',
            "userType": notifyUserType.toString(),
            "message": messageContent.toString()
          };
  
          if(isReservationUpdated){
            sendNotifications(notifyContent, notifyUserId);
            return {
              status: 200
            }
          } else {
            return {
                errorMessage: 'Cancel Reservation not updated',
                status: 400
              };
          }
  
      } else {
          return {
            errorMessage: 'You are not loggedIn',
            status: 500
          };
      }
    } catch (error) {
        return {
        errorMessage: 'Something went wrong' + error,
        status: 400
        };
    }
    },
  };
  
  export default cancelReservation;