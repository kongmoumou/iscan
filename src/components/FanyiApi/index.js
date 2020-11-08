import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import qs from 'qs';
import Button from 'antd-mobile/es/button';
import 'antd-mobile/es/button/style/index.css';
import axios from '../../utils/axios';
import md5 from 'crypto-js/md5';
import $ from 'jquery';
import './index.scss';

import Result, { STATE } from '../Result';

const fetchBaiduOcrRes = (image) => {
  return axios.post(
    `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?${qs.stringify({
      access_token: process.env.REACT_APP_BAIDU_KEY,
    })}`,
    `image=${encodeURIComponent(image)}&detect_language=true`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
};

const fetchFanyiRes = (src) => {
  const salt = Math.floor(Math.random() * Math.floor(1000));

  return new Promise((resolve, reject) => {
    $.ajax({
      url: 'https://api.fanyi.baidu.com/api/trans/vip/translate',
      type: 'get',
      dataType: 'jsonp',
      data: {
        q: src,
        from: 'auto',
        to: 'zh',
        appid: process.env.REACT_APP_FANYI_ID,
        salt,
        sign: md5(
          process.env.REACT_APP_FANYI_ID +
            src +
            salt +
            process.env.REACT_APP_FANYI_KEY
        ).toString(),
      },
      success: function (data) {
        resolve(data);
      },
      error() {
        reject(arguments);
      },
    });
  });
};

const type = {
  words_result: [
    {
      words: '',
    },
  ],
};

const FanyiPreview = ({ data }) => {
  const [showTranslation, setShowTranslation] = useState(false);

  const src = data?.words_result.map((v) => v?.words).join('\n');

  const { data: fanyiRes, isValidating, error } = useSWR(
    showTranslation ? src : null,
    fetchFanyiRes
  );

  return (
    <div className="fanyi__container">
      <div className="fanyi__ocr">{src}</div>
      <div className="fanyi__action">
        <Button
          type="ghost"
          inline
          size="small"
          style={{ color: '#07c160' }}
          onClick={() => {
            setShowTranslation(true);
          }}
        >
          翻译
        </Button>
      </div>
      <div className="fanyi__result">
        {isValidating && (
          <img
            src="/fanyi-loading.gif"
            className="fanyi__loading"
          />
        )}
        {!isValidating && fanyiRes && (
          <div className="fanyi__result-content">
            {fanyiRes?.trans_result.map((v) => v.dst).join('\n')}
          </div>
          // <pre>{JSON.stringify(fanyiRes, null, 2)}</pre>
        )}
      </div>
    </div>
  );
};

export default function BaiduApi({ img = '' }) {
  const formatedImg = img.substr(img.indexOf(',') + 1);

  const { data, isValidating, error } = useSWR(formatedImg, fetchBaiduOcrRes);

  return (
    <Result
      state={
        isValidating || !data ? STATE.LOADING : error ? STATE.ERROR : STATE.DONE
      }
    >
      {!isValidating && !!data?.data?.words_result?.length && (
        // <pre>{JSON.stringify(data.data, null, 2)}</pre>
        <FanyiPreview data={data.data} />
      )}
      {error ? String(error) : null}
    </Result>
  );
}
