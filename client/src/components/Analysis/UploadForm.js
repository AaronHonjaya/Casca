import React from 'react';

export const UploadForm = ({ onFileChange, onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      <input type="file" multiple onChange={onFileChange} />
      <button type="submit">Upload</button>
    </form>
  );
};