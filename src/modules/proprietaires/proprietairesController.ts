import { Request, Response } from 'express';
import * as proprietairesService from './proprietairesService';

export const getAll = async (req: Request, res: Response) => {
  try {
    const data = await proprietairesService.getAll();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const data = await proprietairesService.getById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, error: { message: 'Owner not found' } });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const id = await proprietairesService.create(req.body);
    res.status(201).json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};
