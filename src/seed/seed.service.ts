import { Pokemon } from './../pokemon/entities/pokemon.entity';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios, { AxiosInstance } from 'axios';
import { Model } from 'mongoose';
import { PokeResponse } from './interfaces/poke-response.interface';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}
  private readonly axios: AxiosInstance = axios;
  async executeSeed() {
    await this.pokemonModel.deleteMany({}); // delete * from pokemon
    const { data } = await this.axios.get<PokeResponse>(
      'https://pokeapi.co/api/v2/pokemon?limit=650',
    );
    const newData: { name: string; no: number }[] = data.results.map(
      (data) => ({
        name: data.name,
        no: Number(data.url.split('/')[6]),
      }),
    );

    try {
      await this.pokemonModel.insertMany(newData);
    } catch (error) {
      this.handleExceptions(error);
    }
    return 'Seed Executed';
  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(
        `Pokemon exists in db ${JSON.stringify(error.keyValue)}`,
      );
    }
    throw new InternalServerErrorException(
      `Can't create Pokemon - Check server logs`,
    );
  }
}
