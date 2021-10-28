import AllReservationType from '../../types/AllReservationType';
import { Reservation, User } from '../../models';

import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
    GraphQLBoolean as BooleanType,
    GraphQLFloat as FloatType
} from 'graphql';

const getAllReservation = {

    type: AllReservationType,

    args: {
        userType: { type: StringType },
        currentPage: { type: IntType },
        dateFilter: { type: StringType }
    },

    async resolve({ request }, { userType, currentPage, dateFilter }) {

        try {

            const limit = 10;
            let offset = 0;
            // Offset from Current Page

            if (currentPage) {
                offset = (currentPage - 1) * limit;
            }
            if (request.user && request.user.id) {
                const userId = request.user.id;

                let where;
                let paymentState = 'completed';
                let today = new Date();
                today.setHours(0, 0, 0, 0);

                let tripFilter = {
                    $gte: today
                };

                let statusFilter = {
                    $in: ['pending', 'approved', 'declined', 'cancelled']
                };

                if (dateFilter == 'previous') {
                    tripFilter = {
                        $lt: today
                    };
                    statusFilter = {
                        $in: ['expired', 'completed']
                    };
                }

                if (dateFilter == 'previous') {

                    if (userType === 'host') {
                        where = {
                            hostId: userId,
                            paymentState,
                            $or: [
                                {
                                    checkOut: tripFilter
                                },
                                {
                                    reservationState: statusFilter
                                }
                            ]
                        };
                    } else {
                        where = {
                            guestId: userId,
                            paymentState,
                            $or: [
                                {
                                    checkOut: tripFilter
                                },
                                {
                                    reservationState: statusFilter
                                }
                            ]
                        };
                    }
                } else {

                    if (userType === 'host') {
                        where = {
                            hostId: userId,
                            paymentState,
                            $and: [
                                {
                                    checkOut: tripFilter
                                },
                                {
                                    reservationState: statusFilter
                                }
                            ]
                        };
                    } else {

                        where = {
                            guestId: userId,
                            paymentState,
                            $and: [
                                {
                                    checkOut: tripFilter
                                },
                                {
                                    reservationState: statusFilter
                                }
                            ]
                        };
                    }
                }

                const userData = await User.findOne({
                    attributes: [
                        'userBanStatus'
                    ],
                    where: { id: request.user.id },
                    raw: true
                })


                if (userData) {
                    if (userData.userBanStatus == 1) {
                        return {
                            errorMessage: 'You have blocked, Please contact support team.',
                            status: 500
                        }
                    }
                }

                const count = await Reservation.count({ where });

                const reservationData = await Reservation.findAll({
                    where,
                    order: [['checkIn', 'DESC']],
                    limit: limit,
                    offset: offset,
                });
                if (reservationData.length > 0) {
                    return {
                        result: reservationData,
                        count,
                        status: 200
                    };
                }
                else {
                    return {
                        status: 400,
                        errorMessage: "Something went wrong"
                    };
                }
            } else {
                return {
                    status: 500,
                    errorMessage: "You are not loggedIn",
                };
            }

        } catch (error) {
            return {
                errorMessage: 'Something went wrong' + error,
                status: 5400
            };
        }
    }
};

export default getAllReservation;

/**

query getAllReservation ($userType: String){
  getAllReservation(userType: $userType){
    id
    listId
    checkIn
    checkOut
    guestServiceFee
    hostServiceFee
    reservationState
        total
    message {
      id
    }
    listData {
      id
      title
      street
      city
      state
      country
    }
    hostData {
      profileId
      displayName
      picture
    }
    guestData {
      profileId
      displayName
      picture
    }
  }
}

**/