import ListSettingsCommonType from '../../types/ListingSettingsType';

import { ListSettings, ListSettingsTypes } from '../../../data/models';

import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
  GraphQLObjectType as ObjectType,
  GraphQLBoolean as BooleanType,
} from 'graphql';

const getListingSettingsCommon = {

  type: ListSettingsCommonType,

  args: {
    step: { type: StringType }
  },

  async resolve({ request }, { step }) {
    try {
      let where;
      if (step != undefined) {
        where = { where: { step: step } };
      }

      where = Object.assign({}, where, { isEnable: true });

      const getResults = await ListSettingsTypes.findAll({
        ...where
      });

      if (!getResults) {
        return await {
          status: 400,
          errorMessage: "Something went wrong!",
          results: []
        }
      }

      return await {
        status: 200,
        results: getResults
      };
    }
    catch (error) {
      return {
        errorMessage: 'Something went wrong' + error,
        status: 400
      };
    }
  },

};

export default getListingSettingsCommon;