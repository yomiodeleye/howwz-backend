import SiteSettingsCommonType from '../../types/siteadmin/SiteSettingsType';
import { SiteSettings } from '../../../data/models';

import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
} from 'graphql';

const siteSettings = {

  type: SiteSettingsCommonType,

  args: {
    type: { type: StringType },
  },

  async resolve({ request }, { type }) {

    try{

    let siteSettingsData;

    if (type != null) {
      // Get Specific Type of Settings Data
      siteSettingsData = await SiteSettings.findAll({
        attributes: [
          'id',
          'title',
          'name',
          'value',
          'type'
        ],
        where: {
          type: type
        }
      });

    } else {
      // Get All Site Settings Data
      siteSettingsData = await SiteSettings.findAll({
        attributes: [
          'id',
          'title',
          'name',
          'value',
          'type'
        ]
      });
    }

    return {
      status:200,
      results: siteSettingsData
    };

    } catch (error) {
      return {
        errorMessage: 'Something went wrong' + error,
        status: 400
      };
    }

  },
};

export default siteSettings;
