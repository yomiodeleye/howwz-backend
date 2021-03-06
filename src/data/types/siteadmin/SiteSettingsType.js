import {
    GraphQLObjectType as ObjectType,
    GraphQLString as StringType,
    GraphQLInt as IntType,
    GraphQLNonNull as NonNull,
    GraphQLList as List,
} from 'graphql';

const SiteSettingsType = new ObjectType({
    name: 'SiteSettings',
    fields: {
        id: { type: IntType },
        title: { type: StringType },
        name: { type: StringType },
        value: { type: StringType },
        type: { type: StringType },
        status: { type: StringType }
    },
});

const SiteSettingsCommonType = new ObjectType({
    name: 'SiteSettingsCommon',
    fields: {
        results: { 
            type: new List(SiteSettingsType)
        },
        status: { 
            type: IntType 
        },
        errorMessage: { 
            type: StringType 
        }
    },
});

export default SiteSettingsCommonType;
