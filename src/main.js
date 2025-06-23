import './styles.css'
import webgl from './webgl'
import misc from './misc'
import { Gradient } from './gradient'



webgl()
misc()
const gradient = new Gradient()
gradient.initGradient('#gradient-canvas')