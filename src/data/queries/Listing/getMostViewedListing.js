import ListType from '../../types/ListType';
import { ListViews, Listing } from '../../../data/models';
import sequelize from '../../sequelize';

import {
    GraphQLList as List,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
    GraphQLBoolean as BooleanType,
    GraphQLFloat as FloatType
} from 'graphql';

const getMostViewedListing = {

    type: ListType,

    async resolve({ request }) {

        try{

        const getAllListing =  Listing.findAll({
            where: {
                isPublished: true
            },
            include: [
                {
                    model: ListViews,
                    attributes: [],
                    as: 'listViews',
                    required: true,
                    duplicating: false
                }
            ],
            order: [
                [sequelize.fn('count', sequelize.col('listViews.listId')), 'DESC'],
            ],
            group: ['listViews.listId'],
            limit: 10,
            offset: 0
        });
        
        if (getAllListing) {
            return {
                results: getAllListing,
                status: 200
            }
        } else {
            return {
                status: 400,
                errorMessage: "Something Went Wrong"
            }
        }

        } catch (error) {
            return {
            errorMessage: 'Something went wrong' + error,
            status: 400
            };
        }

    }
};

export default getMostViewedListing;

/*

{
  getMostViewedListing {
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
    wishListStatus
    isListOwner
    listPhotoName
    roomType
  }
}

*/