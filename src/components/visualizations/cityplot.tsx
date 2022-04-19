import { Flex, Box, Spinner, Grid, Skeleton } from '@chakra-ui/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { BackendContext, MapActions } from '../../state/BackendContext';
import ConnectivityMap from '../connectivityMap/';
import Graph3D from "react-graph3d-vis";

const cityplot = ({ }) => {
    const data = [];
    for (let i = 0; i <= 10; i = i + 5) {
        for (let j = 0; j <= 10; j = j + 5) {
            // x_data.push(i);
            // y_data.push(j);
            // z_data.push(i ** 2 * j ** (1 / 2));
            data.push({ x: i, y: j, z: i ** 2 * j ** (1 / 2) });
        }
    }

    return (
        <Flex flexDir='column' alignItems='center'>
            <Graph3D
                data={data}
                options={{
                    width: "600px",
                    height: "500px",
                    style: "bar",
                    tooltip: true,
                    keepAspectRatio: true,
                    verticalRatio: 1,
                    animationInterval: 100,
                    animationPreload: true,
                    xLabel: "x",
                    yLabel: "y",
                    zLabel: "z",
                    cameraPosition: {
                        distance: 2
                    }
                }}
            />
        </Flex>
    );
};

export default cityplot;
