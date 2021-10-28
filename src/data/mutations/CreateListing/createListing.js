// GrpahQL
import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
  GraphQLBoolean as BooleanType,
  GraphQLFloat as FloatType,
} from 'graphql';

import fetch from 'node-fetch'
import { url, googleMapAPI } from '../../../config';

// GraphQL Type
import CreateListingType from '../../types/CreateListingType';

// Sequelize models
import {
  Listing,
  UserListingSteps,
  UserListingData,
  BedTypes,
  UserAmenities,
  UserSafetyAmenities,
  UserSpaces
} from '../../../data/models';

const createListing = {

  type: CreateListingType,

  args: {
    listId: { type: IntType },
    roomType: { type: StringType },
    houseType: { type: StringType },
    residenceType: { type: StringType },
    bedrooms: { type: StringType },
    buildingSize: { type: StringType },
    bedType: { type: StringType },
    beds: { type: IntType },
    personCapacity: { type: IntType },
    bathrooms: { type: FloatType },
    bathroomType: { type: StringType },
    country: { type: StringType },
    street: { type: StringType },
    buildingName: { type: StringType },
    city: { type: StringType },
    state: { type: StringType },
    zipcode: { type: StringType },
    lat: { type: FloatType },
    lng: { type: FloatType },
    bedTypes: { type: StringType },
    isMapTouched: { type: BooleanType },
    amenities: { type: new List(IntType) },
    safetyAmenities: { type: new List(IntType) },
    spaces: { type: new List(IntType) },
  },

  async resolve({ request, response }, {
    listId,
    roomType,
    houseType,
    residenceType,
    bedrooms,
    buildingSize,
    bedType,
    beds,
    personCapacity,
    bathrooms,
    bathroomType,
    country,
    street,
    buildingName,
    city,
    state,
    zipcode,
    lat,
    lng,
    bedTypes,
    isMapTouched,
    amenities,
    safetyAmenities,
    spaces,
  }) {

    try {

      let doCreateListing, doUpdateListing;

      if (listId) {

        // console.log('id update', listId);
        let isListUpdated = false;

        if (request.user || request.user.admin) {

          const address = street + ", " + city + ", " + state + ", " + country + ", " + zipcode;
          const URL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(address) + '&key=' + googleMapAPI;
          let latValue, lngValue, locationData = {};

          const response = await new Promise((resolve, reject) => {
            fetch(URL, {
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              method: 'GET',
            }).then(res => res.json())
              .then(function (body) {
                if (body) {
                  resolve(body)
                } else {
                  reject(error)
                }
              });
          });
          // console.log('response', response);

          if (response && response.results && response.results.length > 0) {
            response.results.map((item, key) => {
              item.address_components.map((value, key) => {
                if (value.types[0] == 'administrative_area_level_1' || value.types[0] == 'country') {
                  locationData[value.types[0]] = value.short_name;
                } else {
                  locationData[value.types[0]] = value.long_name;
                }

              });
            });
            let city = locationData.administrative_area_level_2 != undefined ? locationData.administrative_area_level_2 : locationData.locality;
            latValue = response.results[0].geometry.location.lat;
            lngValue = response.results[0].geometry.location.lng;

            // console.log('latValue', latValue);
            // console.log('lngValue', lngValue);
          }
          latValue = lat ? lat : latValue;
          lngValue = lng ? lng : lngValue;

          // console.log('latValue', latValue);
          // console.log('lngValue', lngValue);

          let where = { id: listId };
          if (!request.user.admin) {
            where = {
              id: listId,
              userId: request.user.id
            }
          };

          doUpdateListing = await Listing.update({
            residenceType: residenceType,
            bedrooms: bedrooms,
            bedType: bedType,
            beds: beds,
            personCapacity: personCapacity,
            bathrooms: bathrooms,
            country: country,
            street: street,
            buildingName: buildingName,
            city: city,
            state: state,
            zipcode: zipcode,
            lat: latValue,
            lng: lngValue,
            isMapTouched: isMapTouched
          },
            {
              where
            })

          // User Settings Data
          if (doUpdateListing) {
            const removeUserSettingsData = await UserListingData.destroy({
              where: {
                listId: listId
              }
            });

            let otherListSettings = [
              { settingsId: roomType, listId: listId },
              { settingsId: houseType, listId: listId },
              { settingsId: buildingSize, listId: listId },
              // { settingsId: bedType, listId: listId },
              { settingsId: bathroomType, listId: listId }
            ];
            // Bulk create on UserListingData to store other settings of this listingSteps
            const createOtherSettings = await UserListingData.bulkCreate(otherListSettings);

            // Amenities
            if (amenities != null && amenities != undefined) {
              const removeAmenities = await UserAmenities.destroy({
                where: {
                  listId: listId
                }
              });
              amenities.map(async (item, key) => {
                let updateAmenities = await UserAmenities.create({
                  listId: listId,
                  amenitiesId: item
                })
              });
            }

            // Safety Amenities
            if (safetyAmenities != null && safetyAmenities != undefined) {
              const removeSafetyAmenities = await UserSafetyAmenities.destroy({
                where: {
                  listId: listId
                }
              });
              safetyAmenities.map(async (item, key) => {
                let updateSafetyAmenities = await UserSafetyAmenities.create({
                  listId: listId,
                  safetyAmenitiesId: item
                })
              });
            }

            // Spaces
            if (spaces != null && spaces != undefined) {
              const removeSpaces = await UserSpaces.destroy({
                where: {
                  listId: listId
                }
              });
              spaces.map(async (item, key) => {
                let updateUserSpaces = await UserSpaces.create({
                  listId: listId,
                  spacesId: item
                })
              });
            }

            let bedTypeData;
            if (bedTypes && bedTypes.length > 0) {
              bedTypeData = JSON.parse(bedTypes);
              let completeData = [];

              // Bed types
              if (bedTypeData != null && bedTypeData != undefined) {

                const removeBedTypes = await BedTypes.destroy({
                  where: {
                    listId: listId
                  }
                });

                // console.log('bedTypeData', bedTypeData);

                await Promise.all(bedTypeData.map(async (item, key) => {

                  for (let i = 0; i < item.bedCount; i++) {
                    let sourceObject = {};
                    sourceObject["bedType"] = item.bedType;
                    sourceObject["bedCount"] = item.bedCount;
                    sourceObject["listId"] = listId;
                    completeData.push(sourceObject);
                  }

                  // console.log('completeData', completeData);

                  // let updateBedTypes = await BedTypes.create({
                  //   listId: listId,
                  //   bedCount: item.bedCount,
                  //   bedType: item.bedType
                  // })
                })
                );

                if (completeData && completeData.length > 0) {
                  const updateBedTypes = await BedTypes.bulkCreate(completeData);
                }

                // await Promise.all(bedTypeData.map(async (item, key) => {
                //   let updateBedTypes = await BedTypes.create({
                //     listId: listId,
                //     bedCount: item.bedCount,
                //     bedType: item.bedType
                //   })
                // })
                // );
              }
            }

            const listData = await Listing.findOne({
              where: {
                id: listId
              },
              raw: true
            });

            return {
              id: listId,
              status: 200,
              actionType: 'update',
              results: listData
            }
          } else {
            return {
              status: 400,
              errorMessage: 'Failed to update'
            }
          }

        } else {
          return {
            status: 500,
            errorMessage: 'Not a logged user.'
          };
        }
      } else {

        if (request.user && request.user.admin != true) {

          const address = street + ", " + city + ", " + state + ", " + country + ", " + zipcode;
          const URL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(address) + '&key=' + googleMapAPI;
          let latValue, lngValue, locationData = {};

          const response = await new Promise((resolve, reject) => {
            fetch(URL, {
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              method: 'GET',
            }).then(res => res.json())
              .then(function (body) {
                if (body) {
                  resolve(body)
                } else {
                  reject(error)
                }
              });
          });
          // console.log('response', response);

          if (response && response.results && response.results.length > 0) {
            response.results.map((item, key) => {
              item.address_components.map((value, key) => {
                if (value.types[0] == 'administrative_area_level_1' || value.types[0] == 'country') {
                  locationData[value.types[0]] = value.short_name;
                } else {
                  locationData[value.types[0]] = value.long_name;
                }

              });
            });
            let city = locationData.administrative_area_level_2 != undefined ? locationData.administrative_area_level_2 : locationData.locality;
            latValue = response.results[0].geometry.location.lat;
            lngValue = response.results[0].geometry.location.lng;
          }

          // console.log('latValue', latValue);
          // console.log('lngValue', lngValue);

          doCreateListing = await Listing.create({
            userId: request.user.id,
            residenceType: residenceType,
            bedrooms: bedrooms,
            beds: beds,
            personCapacity: personCapacity,
            bathrooms: bathrooms,
            country: country,
            street: street,
            buildingName: buildingName,
            city: city,
            state: state,
            zipcode: zipcode,
            lat: latValue,
            lng: lngValue
          });

          if (doCreateListing) {

            // Recently added list id
            const id = doCreateListing.dataValues.id;

            let bedTypeData;
            if (bedTypes && bedTypes.length > 0) {

              bedTypeData = JSON.parse(bedTypes);
              let completeData = [];

              // items included
              if (bedTypeData != null && bedTypeData != undefined) {

                const removeBedTypes = await BedTypes.destroy({
                  where: {
                    listId: id
                  }
                });

                await Promise.all(bedTypeData.map(async (item, key) => {
                  for (let i = 0; i < item.bedCount; i++) {
                    let sourceObject = {};
                    sourceObject["bedType"] = item.bedType;
                    sourceObject["bedCount"] = item.bedCount;
                    sourceObject["listId"] = id;
                    completeData.push(sourceObject);
                  }

                  // let updateBedTypes = await BedTypes.create({
                  //   listId: id,
                  //   bedCount: item.bedCount,
                  //   bedType: item.bedType
                  // })

                })
                );

                if (completeData && completeData.length > 0) {
                  const createBedTypes = await BedTypes.bulkCreate(completeData);
                }

              }
            }

            // Assign other settings values in here
            let otherListSettings = [
              { settingsId: roomType, listId: id },
              { settingsId: houseType, listId: id },
              { settingsId: buildingSize, listId: id },
              // { settingsId: bedType, listId: id },
              { settingsId: bathroomType, listId: id }
            ];

            // Bulk create on UserListingData to store other settings of this listingSteps
            const createOtherSettings = await UserListingData.bulkCreate(otherListSettings);

            return {
              status: 200,
              id: id,
              actionType: 'create',
              results: doCreateListing
            };
          } else {
            return {
              status: 400,
            };
          }

        } else {
          return {
            status: 500,
            errorMessage: "Not a logged user."
          };
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

export default createListing;
