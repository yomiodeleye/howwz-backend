import ListSettingsCommonType from '../../types/ListingSettingsCommonType';

import { ListSettings, ListSettingsTypes } from '../../../data/models';

import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
  GraphQLObjectType as ObjectType,
  GraphQLBoolean as BooleanType,
} from 'graphql';

const getListingSettings = {

  type: ListSettingsCommonType,

  async resolve({ request }) {
    try {
      let where;
      where = Object.assign({}, where, { isEnable: true });

      const getResults = await ListSettingsTypes.findOne({
        attributes: ['id'],
        where
      });

      if (!getResults) {
        return await {
          status: 400,
          errorMessage: 'Something went wrong!',
          results: null
        }
      }

      return await {
        status: 200,
        results: getResults,
      }
    }
    catch (error) {
      return {
        errorMessage: 'Something went wrong' + error,
        status: 400
      };
    }
  },


};

export default getListingSettings;

/*

{
    getListingSettings {
      id
      typeName
      fieldType
      typeLabel
      step
      isEnable
      listSettings {
        id
        typeId
        itemName
        otherItemName
        maximum
        minimum
        startValue
        endValue  
        isEnable
      }
    }
  }

*/