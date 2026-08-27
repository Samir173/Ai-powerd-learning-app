import jwt from 'jsonwebtoken';
import User from '../models/User.js';

//generate JWT token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    })
}

// @desc register new user
// @route POST /api/auth/register
// @access Public
export const register = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
}
// @desc login user
// @route POST /api/auth/login
// @access Public
export const login = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
}
// @desc get user profile
// @route GET /api/auth/profile
// @access Private
export const getProfile = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
}
// @desc update user profile
// @route PUT /api/auth/profile
// @access Private
export const updateProfile = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
}
// @desc change user password
// @route PUT /api/auth/change-password
// @access Private
export const changePassword = async (req, res, next) => {
    try {
    } catch (error) {
        next(error);
    }
}