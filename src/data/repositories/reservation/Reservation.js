import {Reservation} from '../../models'

export const getReservationCount = async ( listId ) => {
    return  await Reservation.count({
        where: {
            listId,
            paymentState: 'completed',
            $or: [
                {

                    reservationState: 'approved'
                },
                {
                    reservationState: 'pending'
                }
            ],
        },
    });
}