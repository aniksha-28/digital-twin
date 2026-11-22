FLOOD-SHAB Dataset
Curated monitoring feature dataset from a cable-stayed bridge case study
=======================================================================

Project acronym: FLOOD-SHAB
Project ID: 101154316
Project title: Structural Health Assessment of Bridges during and after FLOOD events

Dataset title:
FLOOD-SHAB: Cable-stayed bridge case-study SHM monitoring features dataset during the April 2026 hydrometric event

Case study:
Cable-stayed bridge case study crossing the Saline River

Case-study bridge description:
The monitored structure is a steel-concrete composite cable-stayed bridge crossing the Saline River. The bridge has an approximate total length of 188.6 m, with a main span of approximately 103.4 m and two side spans of approximately 42.6 m. The structural system includes a composite deck, inclined steel pylons, stay cables, bearings/isolators, and pile-supported foundations.

Dataset period:
27 March 2026 00:00:00 to 10 April 2026 23:59:59

Files included:
1. CableStayedBridge_SHM_features_2026-03-27_2026-04-10.csv
   Main monitoring feature dataset. One row corresponds to one approximately 30-minute monitoring record.
2. CableStayedBridge_SHM_features_data_dictionary.csv
   Data dictionary describing variable names, descriptions, and units.
3. CableStayedBridge_sensor_channel_mapping.csv
   Mapping between CSV variables, sensor IDs, physical locations, units, and interpretation.
4. CableStayedBridge_monitoring_system_layout.png
   Monitoring-system layout showing locations of load cells, accelerometers, displacement transducers, and environmental sensors.
5. README_CableStayedBridge_SHM_event_dataset.txt
   This documentation file.

Dataset description:
This dataset contains a curated subset of structural health monitoring features from a cable-stayed bridge case study crossing the Saline River. The period was selected to include pre-event behaviour, the April 2026 hydrometric event, and immediate post-event response. The dataset supports research reuse, validation of SHM data-processing workflows, and interpretation of bridge structural response in a flood-related hydraulic context.

Data level:
The dataset contains post-processed monitoring features and record-level summary indicators. The released variables include tracked modal parameters, complex mode-shape components, RMS acceleration indicators, maximum acceleration indicators, displacement transducer means, stay load-cell means, temperature/weather data, and water-level proxy data. Raw acceleration time histories are not included.

Record length and sampling:
The record length is 180000 samples. With a sampling frequency of 100.0 Hz, this corresponds to a nominal duration of 1800 s, i.e. approximately 30 minutes.

Time-series completeness:
The released dataset contains 718 monitoring records. The nominal spacing is approximately 30 minutes. Time gaps and missing expected records are documented by the columns time_gap_from_previous_record_min and missing_previous_record_count in the main dataset file.
The following expected 30-minute monitoring records are missing from the released period:
- 2026-03-27 11:29:40
- 2026-04-03 07:29:40

Sensor layout and channel mapping:
The released dataset is accompanied by a monitoring-system layout figure and a channel-mapping table. The layout figure shows the upstream/downstream bridge sides, stay/deck labels, monitored load-cell locations, accelerometer locations, and piers with displacement transducer locations. The channel-mapping table links each CSV variable to the corresponding sensor ID, physical location, measurement component, unit, and interpretation. These files should be used together when reusing the dataset.

Accelerometer channels:
- AM1Z: Monoaxial accelerometer on deck/stay section U4, Z direction
- AV1Z: Triaxial accelerometer on deck/stay section D4, Z direction
- AV1Y: Triaxial accelerometer on deck/stay section D4, Y direction
- AV1X: Triaxial accelerometer on deck/stay section D4, X direction
- AM2Z: Monoaxial accelerometer on deck/stay section U8, Z direction
- AV2Z: Biaxial accelerometer on deck/stay section D8, Z direction
- AV2X: Biaxial accelerometer on deck/stay section D8, X direction

Stay-cable load cells:
- D1: Stay-cable load cell on stay D1
- U1: Stay-cable load cell on stay U1
- D6: Stay-cable load cell on stay D6
- U7: Stay-cable load cell on stay U7
- D15: Stay-cable load cell on stay D15
- U15: Stay-cable load cell on stay U15
- D20: Stay-cable load cell on stay D20
- U20: Stay-cable load cell on stay U20

Displacement transducers:
- A_pier_Y: Displacement transducer at pier A, Y direction
- A_pier_X: Displacement transducer at pier A, X direction
- B_pier_Y: Displacement transducer at pier B, Y direction
- B_pier_X: Displacement transducer at pier B, X direction

Water-level data:
The water-level variable is a gauge water-level proxy from an upstream Saline River hydrometric station located approximately 3 km upstream of the monitored cable-stayed bridge case study. It is not a direct bridge-mounted local hydraulic measurement. During the April 2026 hydrometric event, the upstream gauge recorded a water level above 5 m before water-level data became unavailable. The subsequent missing water-level values are related to temporary unavailability or malfunctioning of the hydrometric station and should not be interpreted as low-water conditions.

Missing data:
NaN values indicate that a parameter was not available for a given record. For example, if the operational modal analysis procedure did not identify a tracked mode in a given record, the corresponding frequency, damping, MCF, and mode-shape components are reported as NaN. For modes that are not identified, both real and imaginary mode-shape components are set to NaN.

FAIR and access statement:
The dataset is released as a curated, non-sensitive monitoring subset in CSV format to support interoperability and reuse.

Recommended keywords:
bridge structural health monitoring; bridge dynamics; flood impact; structural integrity; hydrodynamic forces; operational modal analysis; water-level proxy; cable-stayed bridge; modal tracking; structural response monitoring.

License:
Creative Commons Attribution 4.0 International (CC BY 4.0).

Suggested citation:
Buka-Vaivade, K., Nicoletti, V., Quarchioni, S., & Gara, F. (2026). FLOOD-SHAB: Cable-stayed bridge case-study SHM monitoring features dataset during the April 2026 hydrometric event (Version 1) [Data set]. Zenodo. DOI: 10.5281/zenodo.20443860

Funding:
This work has received funding from the European Union's Horizon Europe research and innovation programme under the Marie Skłodowska-Curie grant agreement No. 101154316. Views and opinions expressed are, however, those of the authors only and do not necessarily reflect those of the European Union or the European Research Executive Agency (REA). Neither the European Union nor REA can be held responsible for them.
