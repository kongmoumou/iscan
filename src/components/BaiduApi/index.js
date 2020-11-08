import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import qs from 'qs';
import Badge from 'antd-mobile/es/badge';
import 'antd-mobile/es/badge/style/index.css';
import axios from '../../utils/axios';
import Result, { STATE } from '../Result';
import './index.scss';

// https://bkimg.cdn.bcebos.com/pic/72f082025aafa40fb151174aa064034f79f01996

const fetchBaiduSearchRes = (image) => {
  return axios.post(
    `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?${qs.stringify(
      { access_token: process.env.REACT_APP_BAIDU_KEY }
    )}`,
    `image=${encodeURIComponent(image)}&baike_num=2`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
};

const res = {
  score: 0,
  root: '',
  baike_info: {
    baike_url: '',
    image_url: '',
    description: '',
  },
  keyword: '',
};

const BaiduApiPreview = ({ data }) => {
  return (
    <div className="baidu-card__container">
      <div className="baidu-card__title">{data?.keyword}</div>
      <div className="baidu-card__label">
        {
          <>
            <Badge
              text={data?.root}
              style={{
                padding: '0 3px',
                backgroundColor: '#07c160',
                borderRadius: 2,
              }}
            />
            <Badge
              text={data?.score}
              style={{
                padding: '0 3px',
                marginLeft: 12,
                backgroundColor: +data?.score > 0.5 ? '#10aeff' : '#ffc300',
                borderRadius: 2,
              }}
            />
          </>
        }
      </div>
      {/* {data?.baike_info?.image_url && (
        <div className="baidu-card__image">
          <img src={data?.baike_info?.image_url} />
        </div>
      )} */}
      {data?.baike_info?.description && (
        <div className="baidu-card__desc">{data?.baike_info?.description}</div>
      )}
    </div>
  );
};

export default function BaiduApi({ img = '' }) {
  const formatedImg = img.substr(img.indexOf(',') + 1);

  const [count, setCount] = useState(1);

  const { data, isValidating, error } = useSWR(
    img ? [formatedImg, count] : null,
    fetchBaiduSearchRes
  );

  const isError = error || !data?.data?.result?.length;

  return (
    <Result
      state={
        isValidating || !data
          ? STATE.LOADING
          : isError
          ? STATE.ERROR
          : STATE.DONE
      }
      onRetry={() => setCount((v) => v + 1)}
    >
      {!isValidating &&
        !!data?.data?.result?.length &&
        // <pre>{JSON.stringify(data.data, null, 2)}</pre>
        data.data.result
          .slice(0, 2)
          .map((v, i) => <BaiduApiPreview data={v} key={i} />)}
      {error ? String(error) : null}
    </Result>
  );
}
