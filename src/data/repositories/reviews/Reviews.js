import {Reviews} from '../../models'

export const deleteReviewByListingId = async (listId) => {
   return  await Reviews.destroy({
        where: {
            id: listId
        }
    })
};