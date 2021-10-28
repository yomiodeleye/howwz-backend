import AllWishListGroupType from '../../types/AllWishListGroupType';
import { WishListGroup, UserLogin } from '../../models';

import {
    GraphQLInt as IntType,
} from 'graphql';

const getAllWishList = {

    type: AllWishListGroupType,

    async resolve({ request, response }) {
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
                // const limit = 10;
                // let offset = 0;
                // // Offset from Current Page
                // if (currentPage) {
                //     offset = (currentPage - 1) * limit;
                // }
                if (checkLogin) {
                    const count = await WishListGroup.count({
                        where: {
                            userId: request.user.id
                        }
                    });

                    const wishListGroupData = await WishListGroup.findAll({
                        where: {
                            userId: request.user.id
                        },
                        //limit,
                        //offset
                    });
                    if (wishListGroupData && count) {
                        return {
                            status: 200,
                            results: wishListGroupData,
                            count,
                        }

                    } else {
                        return {
                            status: 400,
                            errorMessage: 'Something went wrong'
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
    }
}

export default getAllWishList;

/*

query getAllWishListGroup{
    getAllWishListGroup{
      status
    	count			
    	results {
        id
        name
        userId
        isPublic
        updatedAt
        wishListCount
        wishListCover {
          id
          listId
          listData {
            id
            title
            personCapacity
            beds
            bookingType
            coverPhoto
            reviewsCount,
            reviewsStarRating,
            listPhotos {
              id
              name
              type
              status
            }
            listingData {
              basePrice
              currency
            }
            settingsData {
              listsettings {
                id
                itemName
              }
            }
          }
        }
  		}
      
    }
}

*/