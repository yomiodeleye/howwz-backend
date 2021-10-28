// GrpahQL
import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLFloat as FloatType,
    GraphQLNonNull as NonNull,
} from 'graphql';

import CancellationDetailsType from '../../types/CancellationDetailsType';


// Sequelize models
import { ThreadItems, Threads, User, Reservation, ListBlockedDates, CancellationDetails } from '../../../data/models';

const CancelReservation = {
    type: CancellationDetailsType,
    args: {
        reservationId: { type: new NonNull(IntType) },
        cancellationPolicy: { type: new NonNull(StringType) },
        refundToGuest: { type: new NonNull(FloatType) },
        payoutToHost: { type: new NonNull(FloatType) },
        guestServiceFee: { type: new NonNull(FloatType) },
        hostServiceFee: { type: new NonNull(FloatType) },
        total: { type: new NonNull(FloatType) },
        currency: { type: new NonNull(StringType) },
        threadId: { type: new NonNull(IntType) },
        cancelledBy: { type: new NonNull(StringType) },
        message: { type: new NonNull(StringType) },
        checkIn: { type: new NonNull(StringType) },
        checkOut: { type: new NonNull(StringType) },
        guests: { type: new NonNull(IntType) }
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

        try {
            // Check if user already logged in
            if (request.user && !request.user.admin) {
                const userId = request.user.id;
                let where = {
                    id: userId,
                    userBanStatus: 1
                }
                // Check whether User banned by admin
                const isUserBan = await User.findOne({ where });
                let isReservationUpdated = false;
                if (!isUserBan) {

                    const count = await Reservation.count({
                        where: {
                            id: reservationId,
                            reservationState: 'cancelled'
                        }
                    });

                    if (count > 0) {
                        return {
                            status: 400,
                            errorMessage: 'Something went wrong,Failed to create thread items',
                        };
                    }

                    
                    // Update Reservation table
                    const updateReservation = await Reservation.update({
                        reservationState: 'cancelled'
                    }, {
                            where: {
                                id: reservationId
                            }
                        }).then(function (instance) {
                            // Check if any rows are affected
                            if (instance > 0) {
                                isReservationUpdated = true;
                            }
                        });

                    // Unblock the blocked dates only if guest cancels the reservation
                    if (cancelledBy === 'guest') {

                        
                        // const unlockBlockedDates = await ListBlockedDates.destroy({
                        //     where: {
                        //         reservationId
                        //     }
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

                    if (isReservationUpdated) {
                        return {
                            //results: threadItems,
                            status: 200,
                        };
                    } else {
                        return {
                            status: 400,
                            errorMessage: 'Something went wrong,Failed to create thread items'
                        }
                    }

                } else {
                    return {
                        status: 500,
                        errorMessage: 'Something went wrong.Userbanned'
                    }
                }
            } else {
                return {
                    status: 500,
                    errorMessage: "You are not loggedIn"
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
export default CancelReservation;
