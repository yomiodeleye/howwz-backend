import sequelize from '../../sequelize';
import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLFloat as FloatType,
  GraphQLNonNull as NonNull,
} from 'graphql';

// Models
import { Listing } from '../../../data/models';

// Types
import ShowListingType from '../../types/ShowListingType';
import ListType from '../../types/ListType';

const getSimilarListing = {

  // type: new List(ShowListingType),
  type: ListType,

  args: {
    lat: { type: FloatType },
    lng: { type: FloatType },
    listId: { type: IntType },
    limit: { type: IntType }
  },

  async resolve({ request }, { lat, lng, listId, limit }) {
    try {
      let similarLists = [];
      let listsLimit = (limit) ? limit : 3;
      let getSimilarResults;
      const similarListData = await sequelize.query(`
              SELECT
                    id,
                    (
                      6371 *
                      acos(
                          cos( radians( ${lat} ) ) *
                          cos( radians( lat ) ) *
                          cos(
                              radians( lng ) - radians( ${lng} )
                          ) +
                          sin(radians( ${lat} )) *
                          sin(radians( lat ))
                      )
                  ) AS distance
                FROM
                    Listing
                WHERE
                    (
                       lat IS NOT NULL
                    ) AND (
                       lng IS NOT NULL
                    ) AND (
                      id != ${listId}
                    ) AND (
                      isPublished = true
                    ) AND (
                    id NOT IN (SELECT listId FROM ListingData WHERE maxDaysNotice='unavailable')
                    )
                ORDER BY distance ASC
                LIMIT ${listsLimit}
                OFFSET 0 
    `);

      if (similarListData[0]) {
        similarListData[0].map(async(item, index) => {
          similarLists.push(item.id);
        });

        getSimilarResults = Listing.findAll({
          where: {
            id: {
              $in: [similarLists]
            },
          }
        });

      } else {
        return null;
      }
      if (getSimilarResults) {
        return {
          results: getSimilarResults,
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

export default getSimilarListing;

/*

query ($lat: Float, $lng: Float, $listId: Int, $limit: Int){
	getSimilarListing(listId: $listId, lat: $lat, lng: $lng, limit: $limit){
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
      cleaningPrice
    }
    settingsData {
      listsettings {
        id
        itemName
      }
    }
  }
}

*/
