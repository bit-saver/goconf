import React from 'react';
import {
  Box,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer, TableHead,
  TableRow,
} from '@mui/material';

export default function ListTable({ rows, selected, setSelected }) {
  // const [selected, setSelected] = useState([]);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected([...rows.filter((r) => !r.disabled)]);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, row) => {
    const { name, disabled } = row;
    if (!setSelected || disabled) {
      return;
    }
    const selectedIndex = selected.findIndex((r) => r.name === name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, rows.find((r) => r.name === name));
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const isSelected = (name) => selected.findIndex((r) => r.name === name) !== -1;

  const numSelected = setSelected ? selected.length : 0;
  const enabledRowCount = rows.filter((r) => !r.disabled).length;

  return (
    <Box sx={{ width: '100%' }}>
      <TableContainer>
        <Table
          aria-labelledby="tableTitle"
          size="medium"
        >
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={numSelected > 0 && numSelected < enabledRowCount}
                  checked={enabledRowCount > 0 && numSelected === enabledRowCount}
                  onChange={handleSelectAllClick}
                  inputProps={{
                    'aria-label': 'select all',
                  }}
                />
              </TableCell>
              { rows[0].slotName && rows[0].sceneName
                && (
                  <>
                    <TableCell
                      key="th-slot"
                      align="left"
                      padding="normal"
                      sx={{ fontWeight: 'bold' }}
                    >
                      Slot
                    </TableCell>
                    <TableCell
                      key="th-scene"
                      align="left"
                      padding="normal"
                      sx={{ fontWeight: 'bold' }}
                    >
                      Scene
                    </TableCell>
                  </>
                )}
              { rows[0].deviceName
                && (
                  <TableCell
                    key="th-device"
                    align="left"
                    padding="normal"
                    sx={{ fontWeight: 'bold' }}
                  >
                    Device
                  </TableCell>
                )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const isItemSelected = setSelected && isSelected(row.name);
              const labelId = `enhanced-table-checkbox-${index}`;

              return (
                <TableRow
                  hover
                  onClick={(event) => handleClick(event, row)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={row.name}
                  selected={isItemSelected}
                  sx={{
                    cursor: row.disabled ? 'default' : 'pointer',
                    opacity: row.disabled ? 0.38 : 1,
                  }}
                >
                  <TableCell
                    padding="checkbox"
                    sx={{ borderBottom: 'none' }}
                  >
                    {setSelected
                      && (
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          disabled={row.disabled}
                          inputProps={{
                            'aria-labelledby': labelId,
                          }}
                        />
                      )}
                  </TableCell>
                  <TableCell
                    component="th"
                    id={labelId}
                    scope="row"
                    padding="normal"
                    sx={{ borderBottom: 'none' }}
                  >
                    { row.slotName || row.deviceName }
                  </TableCell>
                  { row.sceneName
                    && <TableCell sx={{ borderBottom: 'none' }}>{row.sceneName}</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
