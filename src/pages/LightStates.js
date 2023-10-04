import React, { useContext, useEffect, useState } from 'react';
import { CircularProgress, Grid, Paper } from '@mui/material';
import Typography from '@mui/material/Typography';
import ApiContext from '../util/ApiContext';

const devices = {
    lamp: {
        label: 'Lamp', entity_id: 'light.lamp', state: null, group: 'Lamp',
    },
    kitchen_1: {
        label: 'Kitchen 1', entity_id: 'light.kitchen_1', state: null, group: 'Balcony',
    },
    kitchen_2: {
        label: 'Kitchen 2', entity_id: 'light.kitchen_2', state: null, group: 'Balcony',
    },
    sink_1: {
        label: 'Sink 1', entity_id: 'light.sink_1', state: null, group: 'Sink',
    },
    sink_2: {
        label: 'Sink 2', entity_id: 'light.sink_2', state: null, group: 'Sink',
    },
    door_1: {
        label: 'Door 1', entity_id: 'light.door_1', state: null, group: 'Door',
    },
    door_2: {
        label: 'Door 2', entity_id: 'light.door_2', state: null, group: 'Door',
    },
    hall_1: {
        label: 'Hall 1', entity_id: 'light.hall_1', state: null, group: 'Hall',
    },
    hall_2: {
        label: 'Hall 2', entity_id: 'light.hall_2', state: null, group: 'Hall',
    },
};

export default function LightStates() {
    const { haGetStates } = useContext(ApiContext);
    const [loaded, setLoaded] = useState(false);
    const [lights, setLights] = useState({ ...devices });

    const getLightStates = async () => {
        const data = await haGetStates()
            .then((result) => result?.data)
            .catch((err) => {
                console.error(err);
                return [];
            });
        console.log('light states result: ', data);
        Object.keys(devices).forEach((key) => {
            const entityId = `light.${key}`;
            const state = data.find((d) => d.entity_id === entityId);
            if (state) {
                lights[key].state = state.attributes;
            }
        });
        console.log('updating lights:', lights);
        setLights({ ...lights });
    };

    useEffect(() => {
        getLightStates().then(() => {
            setLoaded(true);
        });
    }, []);

    if (!loaded) {
        return (
            <CircularProgress />
        );
    }
    return (
        <>
            {Object.values(lights).map((light) => {
                const fill = light.state?.rgb_color ? `rgb(${light.state.rgb_color.join(',')})` : 'rgb(0,0,0)';
                return (
                    <Grid item xs={6} sm={6} md={4} lg={3}>
                        <Paper square={false} sx={{ textAlign: 'center', justifyContent: 'center' }}>
                            <Typography variant="h6" noWrap sx={{ flexGrow: 1 }} component="div">
                                {light.label}
                            </Typography>
                            <svg height="100" width="100">
                                <circle cx="50" cy="50" r="40" stroke="black" strokeWidth="1" fill={fill} />
                            </svg>
                        </Paper>
                    </Grid>
                );
            })}
        </>
    );
}
