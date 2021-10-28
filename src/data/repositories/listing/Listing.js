import {Listing} from '../../models'

export const deleteListingById = async (listId) => {
   return  await Listing.destroy({
        where: {
            id: listId
        }
    })
};