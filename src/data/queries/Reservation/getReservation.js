import ReservationCommonTypes from '../../types/ReservationCommonType';
import { Reservation, ListBlockedDates, ListingData, ServiceFees, CurrencyRates, Currencies } from '../../models';
import { convert } from '../../../helpers/currencyConvertion';
import moment from 'moment';
import {
  GraphQLList as List,
  GraphQLString as StringType,
  GraphQLInt as IntType,
  GraphQLNonNull as NonNull,
  GraphQLBoolean as BooleanType,
  GraphQLFloat as FloatType
} from 'graphql';

const getReservation = {

  type: ReservationCommonTypes,

  args: {
    reservationId: { type: new NonNull(IntType) },
    convertCurrency: { type: StringType }
  },

  async resolve({ request, response }, { reservationId, convertCurrency }) {
    try {
      if (request.user) {
        const id = reservationId;
        const userId = request.user.id;
        let where;
        where = {
          id,
          $or: [
            {
              hostId: userId
            },
            {
              guestId: userId
            }
          ]
        };
        const getReservationData = await Reservation.findOne({
          where
        });
        if (getReservationData) {
          let convertedBasePrice, convertedIsSpecialAverage, convertedTotalNightsAmount, convertedGuestServicefee, convertedHostServiceFee, convertTotalWithGuestServiceFee, convertedCleaningPrice, convertedDiscount, totalNightsAmount, momentStartDate, momentEndDate, totalWithGuestServiceFee, totalNights = 0, rates, ratesData = {};
          let convertedTotalWithHostServiceFee = 0, totalWithHostServiceFee = 0, cleaningFee = 0;
          const data = await CurrencyRates.findAll();
          const base = await Currencies.findOne({ where: { isBaseCurrency: true } });
          data && data.map((item) => {
            ratesData[item.dataValues.currencyCode] = item.dataValues.rate;
          })
          rates = ratesData;

          if (getReservationData.checkIn && getReservationData.checkOut) {
            momentStartDate = moment(getReservationData.checkIn);
            momentEndDate = moment(getReservationData.checkOut);
            totalNights = momentEndDate.diff(momentStartDate, 'days');
          }        

          totalWithGuestServiceFee = getReservationData.total || getReservationData.guestServiceFee ? getReservationData.total + getReservationData.guestServiceFee : 0;

          totalNightsAmount = getReservationData.isSpecialPriceAverage && getReservationData.isSpecialPriceAverage > 0 ? getReservationData.isSpecialPriceAverage * totalNights : getReservationData.basePrice * totalNights;
          totalWithHostServiceFee = (getReservationData.total || getReservationData.hostServiceFee) ? getReservationData.total - getReservationData.hostServiceFee : 0;
          convertedBasePrice = convertCurrency && convertCurrency != getReservationData.currency ? convert(base.symbol, rates, getReservationData.basePrice, getReservationData.currency, convertCurrency) : getReservationData.basePrice;

          if (getReservationData.isSpecialPriceAverage) {
            convertedIsSpecialAverage = convertCurrency && convertCurrency != getReservationData.currency ? convert(base.symbol, rates, getReservationData.isSpecialPriceAverage, getReservationData.currency, convertCurrency) : getReservationData.isSpecialPriceAverage;
          }

          cleaningFee = getReservationData && getReservationData.cleaningPrice ?  getReservationData.cleaningPrice : 0
          convertedTotalNightsAmount = convertCurrency && convertCurrency != getReservationData.currency ? convert(base.symbol, rates, totalNightsAmount, getReservationData.currency, convertCurrency) : totalNightsAmount;

          convertedGuestServicefee = convertCurrency && convertCurrency != getReservationData.currency ? convert(base.symbol, rates, getReservationData.guestServiceFee, getReservationData.currency, convertCurrency) : getReservationData.guestServiceFee;

          convertedHostServiceFee = convertCurrency && convertCurrency != getReservationData.currency ? convert(base.symbol, rates, getReservationData.hostServiceFee, getReservationData.currency, convertCurrency) : getReservationData.hostServiceFee;

          convertTotalWithGuestServiceFee = convertCurrency && convertCurrency != getReservationData.currency ? convert(base.symbol, rates, totalWithGuestServiceFee, getReservationData.currency, convertCurrency) : totalWithGuestServiceFee;

          convertedCleaningPrice = convertCurrency && convertCurrency != getReservationData.currency ? convert(base.symbol, rates, cleaningFee, getReservationData.currency, convertCurrency) : getReservationData.cleaningPrice;

          convertedDiscount = convertCurrency && convertCurrency != getReservationData.currency ? convert(base.symbol, rates, getReservationData.discount, getReservationData.currency, convertCurrency) : getReservationData.discount;

          convertedTotalWithHostServiceFee = convertCurrency && convertCurrency != getReservationData.currency ? convert(base.symbol, rates, totalWithHostServiceFee, getReservationData.currency, convertCurrency) : totalWithHostServiceFee;

        
          return {
            status: 200,
            results: getReservationData,
            convertedBasePrice: convertedBasePrice ? convertedBasePrice.toFixed(2) : 0,
            convertedIsSpecialAverage: convertedIsSpecialAverage ? convertedIsSpecialAverage.toFixed(2) : 0,
            convertedTotalNightsAmount: convertedTotalNightsAmount ? convertedTotalNightsAmount.toFixed(2) : 0,
            convertedGuestServicefee: convertedGuestServicefee ? convertedGuestServicefee.toFixed(2) : 0,
            convertedHostServiceFee: convertedHostServiceFee ? convertedHostServiceFee.toFixed(2) : 0,
            convertTotalWithGuestServiceFee: convertTotalWithGuestServiceFee ? convertTotalWithGuestServiceFee.toFixed(2) : 0,
            convertedCleaningPrice: convertedCleaningPrice ? convertedCleaningPrice.toFixed(2) : 0,
            convertedDiscount: convertedDiscount ? convertedDiscount.toFixed(2) : 0,
            convertedTotalWithHostServiceFee: convertedTotalWithHostServiceFee ? convertedTotalWithHostServiceFee.toFixed(2) : 0
          };
        } else {
          return {
            status: 400,
            errorMessage: 'Sorry, You have provided invalid reservation Id for this User.'
          };
        }
      } else {
        return {
          status: 500,
          errorMessage: 'Currently, you are logging in. Please logout and try again.',
        };
      }
    } catch (error) {
      return {
        errorMessage: 'Something went wrong' + error,
        status: 400
      };
    }
  }
}

export default getReservation;