import SearchSettingsType from '../../types/SearchSettingsType';
import { SearchSettings } from '../../../data/models';

import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
  GraphQLBoolean as BooleanType,
  GraphQLFloat as FloatType,
} from 'graphql';

const getSearchSettings = {

  type: SearchSettingsType,

  async resolve({ request }) {

    try{

    const getAllSearchSettings = await SearchSettings.findOne();

    if (getAllSearchSettings) {
      return {
        results: getAllSearchSettings,
        status: 200
      }
    } else {
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
  }
};

export default getSearchSettings;