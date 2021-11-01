import { useState, useEffect, useCallback } from 'react';

const fetchCurrentWeather = ({authorizationKey, locationName}) => {
  // 加上 return 直接把 fetch API 回傳的 Promise 再回傳出去
  return fetch(`https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${authorizationKey}&locationName=${locationName}
  `)
  .then((resp) => resp.json())
  .then((data) => {
    // STEP 1：定義 locationData 把回傳的資料中會用到的部分取出來
    const locationData = data.records.location[0];

    // STEP 2：將風速（WDSD）和氣溫（TEMP）的資料取出
    const weatherElements = locationData.weatherElement.reduce(
      (neededElements, item) => {
        if (['WDSD', 'TEMP'].includes(item.elementName)) {
          neededElements[item.elementName] = item.elementValue;
        }
        return neededElements;
      },
      {}
    );     
      
    //STEP 3: 回傳資料
    return {
      locationName: locationData.locationName,
      temperature: weatherElements.TEMP,
      windSpeed: weatherElements.WDSD,
      observationTime: locationData.time.obsTime,
    }
    
  });
};
  
const fetchWeatherForecast = ({authorizationKey, cityName}) => {
  return fetch(`https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${authorizationKey}&locationName=${cityName}`)
  .then((resp) => resp.json())
  .then((data) => {
    const locationData = data.records.location[0];
    const weatherElements = locationData.weatherElement.reduce(
    (neededElements, item)=>{
      if(['Wx','PoP','CI'].includes(item.elementName)){
      neededElements[item.elementName] = item.time[0].parameter;
      }
      return neededElements;
    },
    {}
    )

    return {
      description: weatherElements.Wx.parameterName,
      weatherCode: weatherElements.Wx.parameterValue,
      rainPossibility: weatherElements.PoP.parameterName,
      comfortability: weatherElements.CI.parameterName,
    }
  });
}

const useWeatherAPI = ({ locationName, cityName, authorizationKey }) => {
  const [weatherElement, setWeatherElement] = useState({
    locationName: '',
    temperature: 0,
    windSpeed: 0,
    observationTime: new Date(),
    description: '',
    rainPossibility: 0,
    weatherCode: 0,
    comfortability: '',
    isLoading: false,
  });

  // 確保 fetchData 不會因為元件重新轉譯而變成新的
  const fetchData = useCallback(async () => {
    setWeatherElement((prevState) => ({
      ...prevState,
      isLoading: true,
    }));

    const [currentWeather, weatherForecast] = await Promise.all([
      fetchCurrentWeather({authorizationKey, locationName}), 
      fetchWeatherForecast({authorizationKey, cityName}),
    ]);

    setWeatherElement({
      ...currentWeather,
      ...weatherForecast,
      isLoading: false,
    });
  },[authorizationKey, locationName, cityName]);

  useEffect(()=>{
    // console.log('execute function is useEffect');
    fetchData();
  },[fetchData])

  return [weatherElement, fetchData];
};

export default useWeatherAPI;
