import React, { useEffect } from 'react';
import useSWR from 'swr';
import qs from 'qs';
import axios from '../../utils/axios';
import Result, { STATE } from '../Result';

const fetchBaiduOcrRes = (image) => {
  return axios.post(
    `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?${qs.stringify(
      { access_token: process.env.REACT_APP_BAIDU_KEY }
    )}`,
    `image=${encodeURIComponent(image)}&detect_language=true`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
};

export default function BaiduApi({ img = '' }) {
  const formatedImg = img.substr(img.indexOf(',') + 1);

  const { data, isValidating, error } = useSWR(
    formatedImg,
    fetchBaiduOcrRes
  );

  return (
    <Result
      state={
        isValidating || !data ? STATE.LOADING : error ? STATE.ERROR : STATE.DONE
      }
    >
      {!isValidating && !!data?.data?.words_result?.length && (
        <pre>{JSON.stringify(data.data, null, 2)}</pre>
      )}
      {error ? String(error) : null}
    </Result>
  );
}
