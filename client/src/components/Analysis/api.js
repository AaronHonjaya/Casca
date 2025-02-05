import axios from 'axios';

export const uploadFiles = async (formData) => {
    const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data; // Response contains { message, files, tables }
};

export const analyzeTablesRequest = async (tables, currencies) => {
    const response = await axios.post('http://localhost:5000/analyze',{tables: tables, currencies: currencies});
    console.log("Analyze Response:", response.data);
    return response.data;
}