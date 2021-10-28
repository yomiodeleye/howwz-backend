import ListingType from '../../types/ListingType';
import { Listing } from '../../models';

import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
  GraphQLBoolean as BooleanType,
} from 'graphql';

const getListingDetails = {

  type: ListingType,

  args: {
    listId: { type: new NonNull(StringType) },
    preview: { type: BooleanType },
  },

  async resolve({ request }, { listId, preview }) {
    try{
    let where;
    if (request.user && preview) {
      if (!request.user.admin) {
        const userId = request.user.id;
        where = {
          id: listId,
          userId
        };
      } else {
        where = {
          id: listId
        };
      }
    } else {
      where = {
        id: listId,
        isPublished: true,
      };
    }

    const listingData = await Listing.findOne({
      where
    });
     if(listingData){
        return {
            results: listingData,
            status: 200
        }
     }else{
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

  },
};

export default getListingDetails;
