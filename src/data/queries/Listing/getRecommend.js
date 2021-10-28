import ShowListingType from '../../types/ShowListingType';
import { Listing, Recommend } from '../../../data/models';
import ListType from '../../types/ListType';

import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
} from 'graphql';

const getRecommend = {

  // type: new List(ShowListingType),
  type: ListType,

  async resolve({ request }) {
    try {
      // Get Recommended Listings
      const getRecommendList = Listing.findAll({
        where: {
          isPublished: true
        },
        include: [
          { model: Recommend, as: "recommend", required: true },
        ]
      });
      if (getRecommendList) {
        return {
          results: getRecommendList,
          status: 200
        }
      } else {
        return {
          status: 400,
          errorMessage: "Something Went Wrong"
        }
      }
    }
    catch (error) {
      return {
        errorMessage: 'Something went wrong' + error,
        status: 400
      };
    }
  }
};

export default getRecommend;

/*

{
  getRecommend {
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