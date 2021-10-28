//import ShowListingType from '../types/ShowListingType';
import ListPhotosCommonType from '../../types/ListPhotosType';

import { Listing, ListPhotos, Reviews, WishList, Reservation } from '../../models';

import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
} from 'graphql';
import {getReservationCount} from "../../repositories/reservation";
import {getListedPhotosByListingId} from "../../repositories/listPhotos";
import {deleteListingById} from "../../repositories/listing";
import {deleteReviewByListingId} from "../../repositories/reviews";

const RemoveListing = {

  type: ListPhotosCommonType,

  args: {
    listId: { type: new NonNull(IntType) },
  },

  async resolve({ request }, { listId }) {

    try {

      // Check whether user is logged in
      if (request.user) {

        const reservationCount = await getReservationCount(listId)

        if (reservationCount > 0) {
          return {
            status: 400,
            errorMessage: 'You cannot delete this list as it has upcoming bookings or enquiries'
          }
        }else{
        const getPhotos = await getListedPhotosByListingId(listId)

        const removelisting = await deleteListingById(listId)

        const removeReviews = await deleteReviewByListingId(listId)

        if (removelisting > 0) {
          return {
            results: getPhotos,
            status: 200
          }
        } else {
          return {
            status: 400,
            errorMessage: 'Something went wrong'
          }
        }
      }
      } else {
        return {
          status: 500,
          errorMessage: "You are not LoggedIn",
        };
      }

    } catch (error) {
      return {
        errorMessage: 'Something went wrong' + error,
        status: 400
      };
    }
  },
};

export default RemoveListing;