import UserAccountType from '../../types/userAccountType';
import { UserProfile, UserVerifiedInfo } from '../../models';

import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
} from 'graphql';

const RemovePhoneNumber = {

    type: UserAccountType,

    async resolve({ request }) {

        // Check whether user is logged in
        try {

            if (request.user) {
                let published, errorMessage;

                const isValidUser = await UserProfile.count({
                    where: {
                        userId: request.user.id,
                    }
                });

                if (isValidUser) {
                    const publish = await UserProfile.update({
                        countryCode: null,
                        phoneNumber: null,
                        verificationCode: null
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

                    const updatePhoneVerified = await UserVerifiedInfo.update({
                        isPhoneVerified: false
                    }, {
                            where: {
                                userId: request.user.id
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
                        }
                    }

                } else {
                    return {
                        status: 400,
                        errorMessage: 'Something went wrong.'
                    }
                }
            } else {
                return {
                    status: 500,
                    errorMessage: 'You are not loggedIn'
                };
            }

        } catch (error) {
            return {
                errorMessage: 'Something went wrong.' + error,
                status: 400
            }
        }

    },
};

export default RemovePhoneNumber;

/**
mutation {
    RemovePhoneNumber {
        status
    }
}
 */
