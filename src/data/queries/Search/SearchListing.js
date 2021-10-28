import searchListingType from '../../types/searchListingType';
import {
  Listing, 
  SearchSettings, 
  CurrencyRates,
  Currencies,
} from '../../../data/models';
import sequelize from '../../sequelize';
import { googleMapAPI } from '../../../config';

import fetch from 'node-fetch';

import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLFloat as FloatType,
  GraphQLNonNull as NonNull,
  GraphQLBoolean as BoolType
} from 'graphql';
import { convert } from '../../../helpers/currencyConvertion';

const SearchListing = {

  type: searchListingType,

  args: {
    personCapacity: { type: IntType },
    dates: { type: StringType },
    currentPage: { type: IntType },
    lat: { type: FloatType },
    lng: { type: FloatType },
    roomType: { type: new List(IntType) },
    bedrooms: { type: IntType },
    bathrooms: { type: IntType },
    beds: { type: IntType },
    amenities: { type: new List(IntType) },
    spaces: { type: new List(IntType) },
    houseRules: { type: new List(IntType) },
    priceRange: { type: new List(IntType) },
    geography: { type: StringType },
    bookingType: { type: StringType },
    geoType: { type: StringType },
    address: { type: StringType },
    currency: { type: StringType }
    // searchByMap: { type: BoolType },
    // sw_lat: { type: FloatType },
    // sw_lng: { type: FloatType },
    // ne_lat: { type: FloatType },
    // ne_lng: { type: FloatType }
  },

  async resolve({ request }, {
    personCapacity,
    dates,
    currentPage,
    lat,
    lng,
    roomType,
    bedrooms,
    bathrooms,
    beds,
    amenities,
    spaces,
    houseRules,
    priceRange,
    geography,
    bookingType,
    geoType,
    address,
    currency
    // searchByMap,
    // sw_lat,
    // sw_lng,
    // ne_lat,
    // ne_lng
  }) {

    try {

      let limit = 10;
      let offset = 0;
      let attributesParam = ['id', 'title', 'personCapacity', 'lat', 'lng', 'beds', 'coverPhoto', 'bookingType', 'userId'];
      let publishedStatus = {}, personCapacityFilter = {}, datesFilter = {}, locationFilter = {};
      let roomTypeFilter = {}, bedroomsFilter = {}, bathroomsFilter = {}, bedsFilter = {};
      let amenitiesFilter = {}, spacesFilter = {}, houseRulesFilter = {}, priceRangeFilter = {}, geographyFilter = {};
      let bookingTypeFilter = {}, addressFilter = {}, rates, ratesData = {};
      let sw_lat, sw_lng, ne_lat, ne_lng, priceRangeCurrency, unAvailableFilter = {};
      if (bookingType && bookingType === 'instant') {
        bookingTypeFilter = {
          bookingType
        }
      }

      const searchSettings = await SearchSettings.findOne({
        raw: true
      });

      if (searchSettings) {
        // priceRangeCurrency = searchSettings.priceRangeCurrency
        priceRangeCurrency = 'USD'
      }

      const data = await CurrencyRates.findAll();
      const base = await Currencies.findOne({ where: { isBaseCurrency: true } });
      if (data) {
          data.map((item) => {
              ratesData[item.dataValues.currencyCode] = item.dataValues.rate;
          })
      }
      rates = ratesData;

      console.log('searchSettings', searchSettings);
      console.log('priceRangeCurrency', priceRangeCurrency);

      if (address) {
        let city, state, country, countryLongName, stateLongName, cityLongName;
        const URL = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(address) + '&key=' + googleMapAPI;
        let types = [], geoType, viewport;

        const addressfound = await new Promise((resolve, reject) => {
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

        console.log('addesssssssssssss-->', address)
        console.log('addressfoundaddressfound-->', addressfound)

        // console.log('addressfound', addressfound)
        // console.log('URL', URL)

        if (addressfound) {
          addressfound.results.map((value, key) => {

            console.log('Value--->', value)
            viewport = value.geometry.viewport;
            types = value.types;
            sw_lat = viewport.southwest.lat;
            sw_lng = viewport.southwest.lng;
            ne_lat = viewport.northeast.lat;
            ne_lng = viewport.northeast.lng;
            // console.log('address_components', value.address_components)

            value.address_components.map((item, key) => {
              // console.log("item.types[0]",item.types[0])
              if (item.types[0] == "administrative_area_level_1") {
                state = item.short_name;
                stateLongName = item.long_name;
              } else if (item.types[0] == "country") {
                country = item.short_name;
                countryLongName = item.long_name;
              } else if (item.types[0] == "administrative_area_level_2") {
                city = item.short_name;
                cityLongName = item.long_name;
              }

              if (types) {
                if (types.indexOf("country") > -1) {
                  geoType = "country";
                } else if (types.indexOf("administrative_area_level_1") > -1) {
                  geoType = "state";
                } else if (types.indexOf("administrative_area_level_2") > -1) {
                  geoType = "city";
                } else {
                  geoType = null;
                }
              }

              if (sw_lat && ne_lat && sw_lng && ne_lng) {

                console.log('geoType city 1');

                addressFilter = {
                  id: {
                    $in: [
                      sequelize.literal(`
                          SELECT
                              id
                          FROM
                              Listing
                          WHERE
                              (
                                 lat BETWEEN ${sw_lat} AND ${ne_lat} 
                              ) AND (
                                 lng BETWEEN ${sw_lng} AND ${ne_lng}
                              )
                        `)
                    ]
                  }
                };
              } else {

                if (geoType) {
                  if (geoType === 'city') {
                    console.log('geoType city 2');

                    addressFilter = {
                      $or: [
                        {
                          city: city
                        },
                        {
                          city: {
                            $like: cityLongName + '%'
                          }
                        }
                      ]
                    };
                  }
                  else if (geoType === 'state') {
                    console.log('geoType state 3');

                    addressFilter = {
                      $or: [
                        {
                          state: state
                        },
                        {
                          state: {
                            $like: stateLongName + '%'
                          }
                        }
                      ]
                    };
                  } else if (geoType === 'country') {
                    console.log('geoType country 4');

                    addressFilter = {
                      $or: [
                        {
                          country: country
                        },
                        {
                          country: {
                            $like: countryLongName + '%'
                          }
                        }
                      ]
                    };
                  }
                } else {
                  if (city && cityLongName) {
                    console.log('inside city 5');

                    addressFilter = {
                      $or: [
                        {
                          city: city
                        },
                        {
                          city: {
                            $like: cityLongName + '%'
                          }
                        }
                      ]
                    };

                  }
                  else if (state && stateLongName) {
                    console.log('inside state 6');
                    addressFilter = {
                      $or: [
                        {
                          state: state
                        },
                        {
                          state: {
                            $like: stateLongName + '%'
                          }
                        }
                      ]
                    };
                  }
                  else if (country) {
                    console.log('inside country 7');

                    addressFilter = {
                      $or: [
                        {
                          country: country
                        },
                        {
                          country: {
                            $like: countryLongName + '%'
                          }
                        }
                      ]
                    };
                  } else if (city && state && country && stateLongName && cityLongName) {
                    console.log('inside all 8');

                    addressFilter = {
                      $and: [
                        {
                          state: state
                        },
                        {
                          state: {
                            $like: stateLongName + '%'
                          }
                        },
                        {
                          country: country
                        },
                        {
                          country: {
                            $like: countryLongName + '%'
                          }
                        },
                        {
                          city: city
                        },
                        {
                          city: {
                            $like: cityLongName + '%'
                          }
                        }
                      ]
                    };
                  }
                }
              }
            });
          });
        }
      }

      if (sw_lat && ne_lat && sw_lng && ne_lng) {
        console.log('out side')
        geographyFilter = {
          id: {
            $in: [
              sequelize.literal(`
                  SELECT
                      id
                  FROM
                      Listing
                  WHERE
                      (
                         lat BETWEEN ${sw_lat} AND ${ne_lat} 
                      ) AND (
                         lng BETWEEN ${sw_lng} AND ${ne_lng}
                      )
                `)
            ]
          }
        };
      } else {

        // geoType filter for value such as state or country.

        console.log('out side 2')
        if (geoType) {
          let geographyConverted = await JSON.parse(geography);
          if (geoType === 'state') {
            geographyFilter = {
              $or: [
                {
                  state: geographyConverted.administrative_area_level_1_short
                },
                {
                  state: {
                    $like: geographyConverted.administrative_area_level_1_long + '%'
                  }
                }
              ]
            };
          } else if (geoType === 'country') {
            geographyFilter = {
              country: geographyConverted.country
            };
          }
        } else {
          if (lat && lng) {
            console.log('out side 3')
            let distanceValue = 300;
            geographyFilter = {
              id: {
                $in: [
                  sequelize.literal(`
                SELECT
                    id
                FROM
                    Listing
                WHERE
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
                    ) < ${distanceValue}
              `)
                ]
              }
            };
          }
        }
      }

      // Price Range
      if (priceRange != undefined && priceRange.length > 0) {

        let rangeStart = convert(base, rates, priceRange[0], currency, priceRangeCurrency);
        let rangeEnd = convert(base, rates, priceRange[1], currency, priceRangeCurrency);
        console.log('rangeStart rangeEnd', rangeStart, rangeEnd);
        // rangeStart = rangeStart.toFixed(2);
        // rangeEnd = rangeEnd.toFixed(2);

        priceRangeFilter = {

          id: {
            $in: [
              sequelize.literal(`SELECT listId FROM ListingData WHERE (basePrice / (SELECT rate FROM CurrencyRates WHERE currencyCode=currency limit 1)) BETWEEN ${rangeStart} AND ${rangeEnd}`)
            ]
          }

        };
      }

      unAvailableFilter = {
        // $and: [
        // {
        id: {
          $notIn: [
             sequelize.literal(`SELECT listId FROM ListingData WHERE maxDaysNotice='unavailable'`)
          ]
        }
        //  }
        //]   
      };

      // Offset from Current Page
      if (currentPage) {
        offset = (currentPage - 1) * limit;
      }

      // Published Status
      publishedStatus = {
        isPublished: true
      };

      // Bedrooms Filter
      if (bedrooms) {
        bedroomsFilter = {
          bedrooms: {
            $gte: bedrooms
          }
        };
      }

      // Bathrooms Filter
      if (bathrooms) {
        bathroomsFilter = {
          bathrooms: {
            $gte: bathrooms
          }
        };
      }

      // Beds Filter
      if (beds) {
        bedsFilter = {
          beds: {
            $gte: beds
          }
        };
      }

      // Person Capacity Filter

      if (personCapacity) {
        personCapacityFilter = {
          personCapacity: {
            $gte: personCapacity
          }
        };
      }

      // Date Range Filter
      if (dates) {
        datesFilter = {
          $or: [
            {
              id: {
                $notIn: [
                  sequelize.literal("SELECT listId FROM ListBlockedDates Where calendarStatus!='available'")
                ]
              }
            },
            {
              id: {
                $notIn: [
                  // sequelize.literal("SELECT listId FROM ListBlockedDates WHERE blockedDates BETWEEN" + dates)
                  sequelize.literal("SELECT listId FROM ListBlockedDates WHERE blockedDates BETWEEN" + dates + " AND calendarStatus != 'available'")

                ]
              }
            }
          ]
        }
      }

      // Room type Filter
      if (roomType != undefined && roomType.length > 0) {
        roomTypeFilter = {

          id: {
            $in: [
              sequelize.literal(`SELECT listId FROM UserListingData WHERE settingsId in(${roomType.toString()})`)
            ]
          }

        };
      }

      // Amenities Filter
      if (amenities != undefined && amenities.length > 0) {
        amenitiesFilter = {
          id: {
            $in: [
              sequelize.literal(`SELECT listId FROM UserAmenities WHERE amenitiesId in(${amenities.toString()}) GROUP BY listId`)
            ]
          }
        };
      }


      // Spaces Filter
      if (spaces != undefined && spaces.length > 0) {
        spacesFilter = {
          id: {
            $in: [
              sequelize.literal(`SELECT listId FROM UserSpaces WHERE spacesId in(${spaces.toString()}) GROUP BY listId`)
            ]
          }
        };
      }

      // House Rules Filter
      if (houseRules != undefined && houseRules.length > 0) {
        houseRulesFilter = {
          id: {
            $in: [
              sequelize.literal(`SELECT listId FROM UserHouseRules WHERE houseRulesId in(${houseRules.toString()}) GROUP BY listId`)
            ]
          }
        };
      }

      // SQL query for count
      const listingCount = await Listing.findAll({
        attributes: attributesParam,
        where: {
          $and: [
            bookingTypeFilter,
            publishedStatus,
            personCapacityFilter,
            datesFilter,
            roomTypeFilter,
            bedroomsFilter,
            bathroomsFilter,
            bedsFilter,
            amenitiesFilter,
            spacesFilter,
            houseRulesFilter,
            priceRangeFilter,
            geographyFilter,
            //addressFilter,
            unAvailableFilter
          ],
        },
      });

      let countLength = Object.keys(listingCount).length;

      // SQL query for results
      const listingData = await Listing.findAll({
        attributes: attributesParam,
        where: {
          $and: [
            bookingTypeFilter,
            publishedStatus,
            personCapacityFilter,
            datesFilter,
            roomTypeFilter,
            bedroomsFilter,
            bathroomsFilter,
            bedsFilter,
            amenitiesFilter,
            spacesFilter,
            houseRulesFilter,
            priceRangeFilter,
            geographyFilter,
            // addressFilter,
            unAvailableFilter
          ],
        },
        limit: limit,
        offset: offset,
      });

      if (listingData && listingData.length > 0) {
        console.log('listingData', listingData.length)
        return {
          currentPage: currentPage,
          count: countLength,
          results: listingData,
          status: 200
        }
      } else {
        return {
          currentPage: currentPage,
          count: countLength,
          results: listingData,
          status: 400,
          errorMessage: "Something went wrong"
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

export default SearchListing;