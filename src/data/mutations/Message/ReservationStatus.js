// GrpahQL
import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
} from 'graphql';
import moment from 'moment';

import SendMessageType from '../../types/SendMessageType';
import { sendNotifications } from '../../../helpers/sendNotifications';

// Sequelize models
import { ThreadItems, Threads, User, Reservation, ListBlockedDates, UserProfile } from '../../../data/models';

const ReservationStatus = {
    type: SendMessageType,
    args: {
        threadId: { type: new NonNull(IntType) },
        content: { type: StringType },
        type: { type: StringType },
        startDate: { type: StringType },
        endDate: { type: StringType },
        personCapacity: { type: IntType },
        reservationId: { type: IntType },
        actionType: { type: StringType }
    },
    async resolve({ request, response }, {
        threadId,
        content,
        type,
        startDate,
        endDate,
        personCapacity,
        reservationId,
        actionType
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
                let isStatus = false;
                if (!isUserBan) {
                    let notifyUserId, notifyUserType, notifyContent;
                    let hostId, guestId, userName, messageContent, listId;

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

                    if (hostProfile && getThread) {
                        userName = hostProfile && hostProfile.displayName ? hostProfile.displayName : hostProfile.firstName
                    }

                    listId = getThread && getThread.listId;

                    // const checkAvailableDates = await ListBlockedDates.findAll({
                    //     where: {
                    //         listId,
                    //         blockedDates: {
                    //             $between: [moment(startDate).format('YYYY-MM-DD HH:MM:SS'), moment(endDate).format('YYYY-MM-DD HH:MM:SS')]
                    //         },
                    //         calendarStatus: {
                    //             $notIn: ['available']
                    //         }
                    //     }
                    // });

                    // if (checkAvailableDates && checkAvailableDates.length > 0) {
                    //     return {
                    //         status: 400,
                    //         errorMessage: 'Those dates are not available.'
                    //     };
                    // }

                    if (actionType == 'approved') {
                        const threadItems = await ThreadItems.create({
                            threadId,
                            sentBy: userId,
                            content,
                            type,
                            startDate,
                            endDate,
                            personCapacity,
                            reservationId
                        });
                        if (threadItems) {
                            const updateThreads = await Threads.update({
                                isRead: false
                            },
                                {
                                    where: {
                                        id: threadId
                                    }
                                }
                            );
                        }

                        const updateReservation = await Reservation.update({
                            reservationState: 'approved'
                        },
                            {
                                where: {
                                    id: reservationId
                                }
                            }
                        );

                        messageContent = userName + ': ' + 'Booking is approved';

                        isStatus = true;
                        notifyContent = {
                            "screenType": "trips",
                            "title": "Approved",
                            "userType": notifyUserType.toString(),
                            "message": messageContent.toString(),
                        };
                    } else if (actionType == 'declined') {

                        const threadItems = await ThreadItems.create({
                            threadId,
                            sentBy: userId,
                            content,
                            type,
                            startDate,
                            endDate,
                            personCapacity,
                            reservationId

                        });
                        if (threadItems) {
                            const updateThreads = await Threads.update({
                                isRead: false
                            },
                                {
                                    where: {
                                        id: threadId
                                    }
                                }
                            );
                        }

                        const updateReservation = await Reservation.update({
                            reservationState: type
                        },
                            {
                                where: {
                                    id: reservationId
                                }
                            }
                        );

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

                        isStatus = true;
                        messageContent = userName + ' : ' + 'Booking is Declined';
                        notifyContent = {
                            "screenType": "trips",
                            "title": "Declined",
                            "userType": notifyUserType.toString(),
                            "message": messageContent.toString(),
                        };

                    }

                    if (isStatus) {
                        sendNotifications(notifyContent, notifyUserId);
                        return {
                            status: 200,
                        };
                    } else {
                        return {
                            status: 400,
                            errorMessage: 'Something went wrong,Failed to create thread items',
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
export default ReservationStatus;
