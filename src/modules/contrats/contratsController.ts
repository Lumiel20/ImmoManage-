import { Request, Response } from 'express';
import * as contratsService from './contratsService';

export const getAll = async (req: Request, res: Response) => {
  try {
    const data = await contratsService.getAllContrats();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const data = await contratsService.getContratById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const id = await contratsService.createContrat(req.body);
    res.status(201).json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    await contratsService.updateContrat(Number(req.params.id), req.body);
    res.json({ success: true, message: 'Contract updated successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await contratsService.deleteContrat(Number(req.params.id));
    res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const data = await contratsService.getDocuments(Number(req.params.id));
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const addDocument = async (req: Request, res: Response) => {
  try {
    const id = await contratsService.addDocument(Number(req.params.id), req.body);
    res.status(201).json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { docId } = req.params;
    const doc = await contratsService.getDocumentById(Number(docId));
    if (!doc) {
      return res.status(404).json({ success: false, error: { message: 'Document not found' } });
    }
    await contratsService.deleteDocument(Number(docId));
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const data = await contratsService.getAllPayments();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getPayments = async (req: Request, res: Response) => {
  try {
    const data = await contratsService.getPayments(Number(req.params.id));
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const id = await contratsService.confirmPayment(Number(req.params.id), req.body);
    res.status(201).json({ success: true, data: { id } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    await contratsService.deletePayment(Number(req.params.paymentId));
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
};

