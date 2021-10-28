import {ListPhotos} from '../../models'

export const getListedPhotosByListingId = async (listId) =>{
   return await ListPhotos.findAll({
        where: { listId }
    })
}