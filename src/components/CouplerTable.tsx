import { TableContainer, Table, Thead, Tr, Th, Tbody, Td } from "@chakra-ui/react";
import React from "react";
import { useQuery } from "react-query";

function parseValue(value: number, exponent:number){
    return( (value * 10**exponent).toPrecision(3) )
}


const ResonatorTable = () => {
    const { isLoading, data, error } = useQuery('backendOverview', () =>
        fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu/data').then((res) => res.json())
    );

    if(isLoading) return <span>Loading</span>

    if(error) return <span>{error} + 'error'</span>

    console.log(data)
    
    return(
        <TableContainer>
        <Table variant='striped' colorScheme='teal'>
          <Thead>
            <Tr>
              <Th>Resonator</Th>
              <Th>Index[X,Y]</Th>
              <Th>Readout Line</Th>
              <Th>Read Length</Th>
              <Th>Read Amp</Th>
              <Th>Read Mod</Th>
              <Th>Frequency</Th>
              <Th>Frequency ge</Th>
              <Th>Frequency Gef</Th>
              {/*<Th>Q_i</Th>
              <Th>Q_c</Th> */}
              <Th>{'\u03BA'}</Th>
            </Tr>
          </Thead>
          <Tbody>
              {data.resonators.map(resonator => 
              <Tr> 
                 <Td>R{resonator.id}</Td>
                 <Td>{resonator.x},{resonator.y}</Td>
                 <Td>{resonator.readout_line}</Td>
                 <Td>{parseValue(resonator.dynamic_properties[0].value,6).slice(0,3)} {'\u03BC'}s</Td>
                 <Td>{parseValue(resonator.dynamic_properties[1].value,3)} mA</Td>
                 <Td>{parseValue(resonator.dynamic_properties[2].value,-6)}MHz</Td>
                 <Td>{parseValue(resonator.static_properties[0].value,-9)}GHz</Td>
                 <Td>{parseValue(resonator.static_properties[1].value,-9)}GHz</Td>
                 <Td>{parseValue(resonator.static_properties[2].value,-9)}GHz</Td>
                {/* <Td>{parseValue(resonator.static_properties[3].value,-6)} M unit?</Td> */}
                { /* <Td>{parseValue(resonator.static_properties[4].value,-3)} K unit?</Td> */}
                 <Td>{parseValue(resonator.static_properties[5].value,-3)}kHz</Td>

              </Tr>)}
          </Tbody>
        </Table>
      </TableContainer>
        
    )

    
}

export default ResonatorTable;
