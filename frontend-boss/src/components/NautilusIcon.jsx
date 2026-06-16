import React from 'react'
import ywllabIcon from '../assets/ywllab.png'

const NautilusIcon = ({ size = 64, className = '', style = {} }) => {
  const defaultStyle = {
    width: size,
    height: size,
    objectFit: 'contain',
    ...style,
  }

  return (
    <img
      src={ywllabIcon}
      alt="Logo"
      className={className}
      style={defaultStyle}
    />
  )
}

export default NautilusIcon
