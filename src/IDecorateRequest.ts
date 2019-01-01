import { Request, Response } from "express";
import ReverestRequest from "./ReverestRequest";

export default interface IDecorateRequest<B> {
    decorateRequest(req: ReverestRequest, bag: B): void;
}