import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';

export default function MapDrawer({ children }) {
  const [state, setState] = React.useState({
    left: false,
  });

  const toggleDrawer =
    (anchor, open) =>
    (event) => {
      if (
        event.type === 'keydown' &&
        (event.key === 'Tab' ||
          event.key === 'Shift')
      ) {
        return;
      }

      setState({ ...state, [anchor]: open });
    };

  const list = (anchor) => (
    <Box
      sx={{ width: 300, padding: 2 }}
      role="presentation"
    >
        {children}
    </Box>
  );

  return (
    <div>
        <React.Fragment key={'left'}>
          <IconButton onClick={toggleDrawer('left', true)} style={{position: 'absolute', top: 10, left: 10, zIndex: 1000, backgroundColor: 'white'}}>
            <MenuIcon />
          </IconButton>
          <Drawer
            anchor={'left'}
            open={state['left']}
            onClose={toggleDrawer('left', false)}
          >
            {list('left')}
          </Drawer>
        </React.Fragment>
    </div>
  );
}
