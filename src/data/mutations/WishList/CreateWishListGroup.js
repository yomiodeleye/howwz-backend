import GetWishListType from '../../types/GetWishListType';
import { WishListGroup, UserLogin } from '../../models';

import {
    GraphQLString as StringType,
} from 'graphql';

const CreateWishListGroup = {

    type: GetWishListType,

    args: {
        name: { type: StringType },
        isPublic: { type: StringType }
    },

    async resolve({ request, response }, { name, isPublic }) {

        let where, status = 200, errorMessage, convertedName;
        let currentToken;

        try {
            if (request.user) {

                currentToken = request.headers.auth;
                where = {
                    userId: request.user.id,
                    key: currentToken
                };

                const checkLogin = await UserLogin.findOne({
                    attributes: ['id'],
                    where
                });
                if (checkLogin) {
                    const createWishListGroup = await WishListGroup.create({
                        userId: request.user.id,
                        name,
                        isPublic
                    });
                    let results = {};
                    if (createWishListGroup) {
                        results = {
                            'id': createWishListGroup.id,
                            'name': name,
                            'isPublic': isPublic
                        }
                        return {
                            status: 200,
                            results
                        }

                    } else {
                        return {
                            status: 400,
                            errorMessage: 'Something went wrong,Unable to create'
                        }

                    }

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
    },
};

export default CreateWishListGroup;

/*

mutation CreateWishListGroup(
    $name: String!,
    $isPublic: String,
){
    CreateWishListGroup(
        name: $name,
        isPublic: $isPublic
    ) {
        status
    }
}

*/
