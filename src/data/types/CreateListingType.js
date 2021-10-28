import {
  GraphQLObjectType as ObjectType,
  GraphQLString as StringType,
  GraphQLBoolean as BooleanType,
  GraphQLInt as IntType,
  GraphQLFloat as FloatType,
  GraphQLList as List,
} from 'graphql';

const CreateListingType = new ObjectType({
  name: 'CreateListing',
  fields: {
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
    status: { type: StringType },
    lat: { type: FloatType },
    lng: { type: FloatType },
    errorMessage: {
      type: StringType
    },
    actionType: { type: StringType },
    amenities: { type: new List(IntType)},
    safetyAmenities: { type: new List(IntType)},
    spaces: { type: new List(IntType)},
    isMapTouched: { type: BooleanType },
    bedTypes: { type: StringType },
  },
});

const ListingResponseType = new ObjectType({
  name: 'ListingResponse',
  fields: {
    results: {
      type: CreateListingType
    },
    status: {
      type: IntType
    },
    errorMessage: {
      type: StringType
    },
    actionType: { type: StringType },
    id: { type: IntType },
  }
});

export default ListingResponseType;
