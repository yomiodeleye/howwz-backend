// GrpahQL
import {
    GraphQLString as StringType,
    GraphQLInt as IntType,
} from 'graphql';

// Models
import {
    UserLogin,
    UserProfile,
    Reservation
} from '../../models';

// Types
import UserCommonType from '../../types/UserCommonType';
import { sendEmail } from '../../../libs/sendEmail';
import { adminEmail } from '../../../config';
const adminMail = adminEmail;

const contactSupport = {
    type: UserCommonType,

    args: {
        message: { type: StringType },
        listId: { type: IntType },
        reservationId: { type: IntType },
        userType: { type: StringType },
    },

    async resolve({ request, response }, {
        message,
        listId,
        reservationId,
        userType
    }) {

        try {
            if (request.user) {
                // Check if the user is already exists
                let currentToken = request.headers.auth;
                let where = {
                    userId: request.user.id,
                    key: currentToken
                };
                const checkUser = await UserLogin.findOne({
                    attributes: ['id'],
                    where
                });
                const getUserData = await UserProfile.findOne({
                    attributes: ['firstName'],
                    where: {
                        userId: request.user.id,
                    }
                });
                let confirmationCode;
                if (checkUser && getUserData) {
                    const getReservationData = await Reservation.findOne({
                        where: {
                            id: reservationId,
                        }
                    });
                    if(getReservationData){
                        confirmationCode = getReservationData.confirmationCode
                    }
                    let content = {
                        ContactMessage: message,
                        email: request.user.email,
                        name: getUserData.firstName,
                        confirmationCode,
                        userType,
                        listId,
                    };
                    const { status, errorMessage } = await sendEmail(adminMail, 'contactSupport', content);
                    return {
                        result: {
                            email: request.user.email,
                            userId: request.user.id,
                            firstName: getUserData.firstName
                        },
                        status: 200,
                    };
                } else {
                    return {
                        errorMessage: "You haven't authorized for this action.",
                        status: 500
                    };
                }
            } else {
                return {
                    errorMessage: "Please login for this action.",
                    status: 500
                };
            }
        } catch (error) {
            return {
                errorMessage: 'Something went wrong.' + error,
                status: 400
            }
        }
    }
};

export default contactSupport;

/*

query ($message: String, $listId: Int, $reservationId: Int, $userType: String) {
  contactSupport(message: $message, listId: $listId, reservationId: $reservationId, userType: $userType) {
    result{
      userId
      email
      firstName
  	}
     status
      errorMessage
  }
}

*/