import UserAccountType from '../../types/userAccountType';
import { UserProfile, UserVerifiedInfo } from '../../models';

import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
} from 'graphql';

const VerifyPhoneNumber = {

    type: UserAccountType,

    args: {
        verificationCode: { type: new NonNull(IntType) }
    },

    async resolve({ request }, { verificationCode }) {


        try {

            if (request.user) {
                let published;

                const isValidCode = await UserProfile.count({
                    where: {
                        userId: request.user.id,
                        verificationCode
                    }
                });

                if (isValidCode) {

                    const updatePhoneVerified = await UserVerifiedInfo.update({
                        isPhoneVerified: true
                    }, {
                            where: {
                                userId: request.user.id
                            }
                        }).spread(function (instance) {
                            // Check if any rows are affected
                            if (instance > 0) {
                                published = true;
                            }
                        });

                    if (published) {
                        return {
                            status: 200
                        };
                    } else {
                        return {
                            status: 400,
                            errorMessage: 'Something went wrong.'
                        };
                    }

                } else {
                    return {
                        status: 400,
                        errorMessage: 'Something went wrong.'
                    }
                }
            }else {
                return {
                    status: 500,
                    errorMessage: 'You are not loggedIn'
                }
            }
        } catch (error) {
            return {
                status: 400,
                errorMessage: 'Something went wrong.' + error
            }
        }
    },
};

export default VerifyPhoneNumber;

/**
mutation VerifyPhoneNumber($verificationCode: Int!) {
    VerifyPhoneNumber(verificationCode: $verificationCode) {
        status
    }
}
 */
