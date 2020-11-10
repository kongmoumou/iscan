import React, { useEffect } from 'react';
import useSWR from 'swr';
import axios from '../utils/axios';
import Badge from 'antd-mobile/es/badge';
import 'antd-mobile/es/badge/style/index.css';
import Result, { STATE } from './Result';

const toHHMMSS = function (timeS) {
  var sec_num = parseInt(timeS, 10); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - hours * 3600) / 60);
  var seconds = sec_num - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = '0' + hours;
  }
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  return hours + ':' + minutes + ':' + seconds;
};

const fetchAnimeSearchRes = (image) => {
  return axios.post('https://trace.moe/api/search', {
    image,
  });
};

const AnimePreview = ({ data }) => {
  useEffect(() => {
    // alert(JSON.stringify(data));
  }, []);

  return (
    <div>
      <img
        src={`https://trace.moe/thumbnail.php?anilist_id=${
          data?.anilist_id
        }&file=${encodeURIComponent(data?.filename)}&t=${data?.at}&token=${
          data?.tokenthumb
        }`}
        style={{ width: '100%', display: 'block', textAlign: 'center' }}
      />
      <div style={{ textAlign: 'center' }}>
        {data?.title_chinese + '-' + data?.episode}
      </div>
      <div style={{ textAlign: 'center', marginBottom: 5 }}>
        <Badge
          text={toHHMMSS(data?.at)}
          style={{
            padding: '0 3px',
            backgroundColor: '#07c160',
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
};

export default function AnimeApi({ img }) {
  const { data, isValidating, error } = useSWR(img, fetchAnimeSearchRes);

  return (
    <Result
      state={
        isValidating || !data ? STATE.LOADING : error ? STATE.ERROR : STATE.DONE
      }
    >
      {!isValidating &&
        !!data?.data?.docs?.length &&
        data.data.docs
          .filter((doc) => !doc.is_adult)
          .map((doc, i) => <AnimePreview key={i} data={doc} />)}
      {error ? String(error) : null}
    </Result>
  );
}
