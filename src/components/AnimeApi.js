import React, { useEffect } from 'react';
import useSWR from 'swr';
import axios from '../utils/axios';
import Result, { STATE } from './Result';

const fetchAnimeSearchRes = (image) => {
  return axios.post('https://trace.moe/api/search', {
    image,
  });
};

const AniemePreview = ({ data }) => {
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
        style={{ width: '100%', display: 'block' }}
      />
      <div>{data?.title_chinese}</div>
    </div>
  );
};

export default function AnimeApi({ img }) {
  const { data, isValidating, error } = useSWR(img, fetchAnimeSearchRes);

  return (
    <Result
      state={(isValidating || !data) ? STATE.LOADING : error ? STATE.ERROR : STATE.DONE}
    >
      {!isValidating &&
        !!data?.data?.docs?.length &&
        data.data.docs.map((doc, i) => <AniemePreview key={i} data={doc} />)}
      {error ? String(error) : null}
    </Result>
  );
}
