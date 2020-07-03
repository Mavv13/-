import React, { useState, useEffect } from 'react';
import Spreadsheet from 'react-spreadsheet';
import debounce from 'lodash.debounce';
import axios from 'axios';
import './App.css';

const BASE_URL = 'https://table-test1.herokuapp.com/api';
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

function App() {
  const DataEditor = ({ getValue, cell, onChange }) => {
    const submit = () => {
      const { key, value } = cell;
      return submitCell({ [key]: value });
    }
    return (
      <input
        type="text"
        onChange={(e) => {
          onChange({ ...cell, value: e.target.value });
        }}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            return submit();
          }
        }}
        value={getValue({ data: cell }) || ''}
        autoFocus
      />
    );
  }

  const [ columnLength, setColumnLength ] = useState(20);
  const [ rowLength, setRowLength ] = useState(10);
  const [ data, setData ] = useState([]);

  const [ isSheetSizeLoading, setIsSheetSizeLoading ] = useState(false);
  const [ isSheetSizeError,setIsSheetSizeError ] = useState(false);

  const changeSheetSize = async () => {
    const data = {
      height: columnLength,
      width: rowLength,
    };

    setIsSheetSizeError(false);
    setIsSheetSizeLoading(true);

    try {
      const result = await axiosInstance({
        url: '/length',
        method: 'POST',
        data,
      });

      setData(result.data);
    } catch (error) {
      setIsSheetSizeError(true);
    }

    setIsSheetSizeLoading(false);
  }

  const submitCell = async (data) => {
    try {
      const result = await axiosInstance({
        url: '/table',
        method: 'POST',
        data,
      });

      setData(result?.data);
    } catch (e) {
      console.error(e);
    }
  }

  const debouncedSetRowLength = debounce(setRowLength, 1500);
  const debouncedSetColumnLength = debounce(setColumnLength, 1500);

  useEffect(() => {
    changeSheetSize()
  }, [rowLength]);

  useEffect(() => {
    changeSheetSize();
  }, [columnLength]);

  const onChange = ({ target: { value}}, isRow = false) => {
    if (Number.isInteger(+value)) {
      return isRow
        ? debouncedSetRowLength(+value)
        : debouncedSetColumnLength(+value);
    }


  }

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isDataError, setIsError] = useState(false);

  const fetchData = async () => {
    setIsError(false);
    setIsDataLoading(true);

    try {
      const result = await axiosInstance({
        method: 'GET',
        url: '/table'
      });

      setData(result.data);
    } catch (error) {
      setIsError(true);
    }

    setIsDataLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const dataWithDataEditor =  data.map((subarray) =>
    subarray.map((item) => {
      item.DataEditor = DataEditor;
      return item;
    })
  );

  const CenteredMessage = ({ msg }) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {msg}
    </div>
  );

  if (isDataLoading || isSheetSizeLoading) {
    return <CenteredMessage msg="Загрузка..." />;
  }

  if (isDataError || isSheetSizeError) {
    return <CenteredMessage msg="Ошибка!" />;
  }

  return (
    <div className="App">
      <h1>Тестовое задание</h1>
      <div className="InputContainer">
        <div>
          <span>Column Length:</span>
          <input
            type="text"
            onChange={(e) => onChange(e)}
          />
        </div>
        <div>
          <span>Row Length:</span>
          <input
            type="text"
            onChange={(e) => onChange(e, true)}
          />
        </div>
      </div>
      <Spreadsheet data={dataWithDataEditor} />
    </div>
  );
}

export default App;
