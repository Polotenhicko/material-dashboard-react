import { AgGridReact } from 'ag-grid-react';
import styles from './Table.module.css';
import {
  TFetchEmployeesResult,
  clearEmployees,
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
} from '../../store/slices/employeesSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { IEmployee } from '../../../shared/types';
import { DEFAULT_LIMIT } from '../../constants/tables';
import {
  CellValueChangedEvent,
  ColDef,
  GridReadyEvent,
  IDatasource,
  ValueFormatterParams,
} from 'ag-grid-community';
import classNames from 'classnames';
import Button from '@mui/material/Button';
import { useEffect, useRef, useState } from 'react';
import { ModalAddRow } from '../ModalAddRow';

export function Table() {
  const employees = useAppSelector(({ employees }) => employees);
  const dispatch = useAppDispatch();
  console.log(employees);

  const gridRef = useRef<AgGridReact>(null);

  const [isOpenAddModal, setIsOpenAddModal] = useState(false);

  const closeModalAddRow = () => {
    setIsOpenAddModal(false);
  };

  useEffect(() => {
    return () => {
      dispatch(clearEmployees());
    };
  }, []);

  const dataSource: IDatasource = {
    rowCount: DEFAULT_LIMIT,

    getRows(params) {
      const { startRow, endRow, successCallback, failCallback } = params;
      dispatch(fetchEmployees({ startRow, endRow })).then((result) => {
        const payload = result.payload as TFetchEmployeesResult;
        console.log(payload);

        const lastRow = payload.hasMore ? undefined : startRow + payload.employees.length;

        successCallback(payload.employees, lastRow);
      });
    },
  };

  const columnDefs: ColDef[] = [
    {
      field: 'employeeId',
      cellRenderer: (props: ValueFormatterParams) => {
        if (props.value !== undefined) {
          return props.value;
        } else {
          return <img src="https://www.ag-grid.com/example-assets/loading.gif" />;
        }
      },
      cellDataType: 'number',
    },
    { field: 'firstName', cellDataType: 'text' },
    { field: 'lastName', cellDataType: 'text' },
    { field: 'position', cellDataType: 'text' },
    { field: 'salary', cellDataType: 'number' },
    { field: 'hireDate', cellDataType: 'dateString' },
    { field: 'departmentId', cellDataType: 'number' },
  ];

  const onCellValueChanged = (event: CellValueChangedEvent<IEmployee>) => {
    const employeeId = event.data.employeeId;
    const fieldName = event.colDef.field;

    if (!fieldName) throw new Error('Doe not have fieldName!');

    dispatch(
      updateEmployee({
        employeeId,
        fields: {
          [fieldName]: event.newValue,
        },
      })
    );
  };

  const defaultColDef: ColDef = {
    flex: 1,
    editable: true,
  };

  const onGridReady = (params: GridReadyEvent<IEmployee>) => {
    params.api.setDatasource(dataSource);
  };

  const handleInsert = (values: Record<string, string>) => {
    dispatch(createEmployee(values)).then(() => {
      dispatch(clearEmployees());
      gridRef.current!.api.refreshInfiniteCache();
    });
  };

  const handleDelete = () => {
    const selectedNodes = gridRef.current!.api.getSelectedNodes();
    if (!selectedNodes.length) return;

    const deletingIds = selectedNodes.map(({ data }: { data: IEmployee }) => data.employeeId);
    dispatch(deleteEmployee(deletingIds)).then(() => {
      dispatch(clearEmployees());
      gridRef.current!.api.refreshInfiniteCache();
    });
  };

  return (
    <div>
      <div className={styles.controlBar}>
        <Button
          onClick={() => setIsOpenAddModal(true)}
          variant="contained"
          disableElevation
          sx={{ color: '#fff' }}
        >
          Add row
        </Button>
        <Button onClick={() => handleDelete()} variant="contained" disableElevation sx={{ color: '#fff' }}>
          Delete rows
        </Button>
      </div>
      <div className="ag-theme-alpine" style={{ height: 500 }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={DEFAULT_LIMIT}
          maxBlocksInCache={DEFAULT_LIMIT}
          onCellValueChanged={onCellValueChanged}
          onGridReady={onGridReady}
          rowModelType="infinite"
          rowSelection="multiple"
        />
      </div>
      {isOpenAddModal && <ModalAddRow fields={columnDefs} onClose={closeModalAddRow} onInsert={handleInsert} />}
    </div>
  );
}
